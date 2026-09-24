import { createServer } from "node:http";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import webPush from "web-push";
import { scanBuffer } from "./clamav.mjs";
import { buildLiveCalendar } from "./live-calendar.mjs";
import { trustedPaddleCustomData } from "./paddle-binding.mjs";
import { agencyDomainFilter } from "./agency-domain.mjs";
import { checkStalwart, decryptMailboxPassword, provisionMailbox } from "./stalwart-provisioning.mjs";

const env = process.env;
const supabaseUrl = required("SUPABASE_URL").replace(/\/$/, "");
const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
// Opaque Supabase secret keys belong only in apikey; legacy service_role JWTs
// still need the bearer header. Sending sb_secret_ as Bearer returns Invalid JWT.
const serviceAuthHeaders = {
  apikey: serviceKey,
  ...(serviceKey.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${serviceKey}` }),
};
const pollMs = boundedNumber(env.WORKER_POLL_MS, 5_000, 1_000, 60_000);
const batchSize = boundedNumber(env.WORKER_BATCH_SIZE, 20, 1, 100);
const healthPort = boundedNumber(env.WORKER_HEALTH_PORT, 9091, 1, 65_535);
let stopping = false;
let lastPollAt = null;
let lastSuccessAt = null;
let lastErrorCode = null;
let lastEntitlementExpiryAt = 0;
let lastAttachmentCleanupAt = 0;
let lastTripPollReminderAt = 0;
let lastAgencyFormCleanupAt = 0;
let lastBookingMailCleanupAt = 0;
let lastPushCleanupAt = 0;
let lastFlightMonitorAt = 0;
const tlsChecks = new Map();

async function activeAgencyWorkspaceForDomain(domain) {
  const filter = agencyDomainFilter(domain);
  if (!filter) return null;
  const check = await fetch(
    `${supabaseUrl}/rest/v1/agency_domains?${filter}&select=workspace_uuid&limit=1`,
    { headers: { ...serviceAuthHeaders }, signal: AbortSignal.timeout(3000) },
  );
  if (!check.ok) throw new Error("AGENCY_DOMAIN_LOOKUP_FAILED");
  const [record] = await check.json();
  if (!record?.workspace_uuid) return null;
  const workspace = await fetch(
    `${supabaseUrl}/rest/v1/workspaces?workspace_uuid=eq.${encodeURIComponent(record.workspace_uuid)}&plan=eq.agency&select=workspace_uuid&limit=1`,
    { headers: { ...serviceAuthHeaders }, signal: AbortSignal.timeout(3000) },
  );
  if (!workspace.ok) throw new Error("AGENCY_PLAN_LOOKUP_FAILED");
  return (await workspace.json()).length === 1 ? record.workspace_uuid : null;
}

async function readRequestBody(request, maximum = 262_144) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maximum)
      throw Object.assign(new Error("REQUEST_TOO_LARGE"), { code: "REQUEST_TOO_LARGE" });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function validPaddleSignature(rawBody, header, secret) {
  const parts = String(header || "")
    .split(";")
    .map((part) => {
      const at = part.indexOf("=");
      return at < 1 ? [part, ""] : [part.slice(0, at), part.slice(at + 1)];
    });
  const timestamp = Number(parts.find(([key]) => key === "ts")?.[1]);
  if (!Number.isInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = Buffer.from(
    createHmac("sha256", secret).update(`${timestamp}:${rawBody}`).digest("hex"),
    "hex",
  );
  return parts
    .filter(([key]) => key === "h1")
    .some(([, value]) => {
      if (!/^[a-f0-9]{64}$/i.test(value)) return false;
      const supplied = Buffer.from(value, "hex");
      return supplied.length === expected.length && timingSafeEqual(supplied, expected);
    });
}

async function enrichPaddleEvent(event) {
  const data = event?.data;
  if (!data || typeof data !== "object")
    throw Object.assign(new Error("PADDLE_EVENT_INVALID"), { code: "PADDLE_EVENT_INVALID" });
  const priceIds = new Set((data.items || []).map((item) => item?.price?.id).filter(Boolean));
  const prices = [
    [env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID, "pro", "recurring"],
    [env.VITE_PADDLE_AGENCY_MONTHLY_PRICE_ID, "agency", "recurring"],
    [env.VITE_PADDLE_PRO_ONETIME_PRICE_ID, "pro", "one_time"],
    [env.VITE_PADDLE_AGENCY_ONETIME_PRICE_ID, "agency", "one_time"],
  ];
  const matched = prices.find(([id]) => id?.trim() && priceIds.has(id.trim()));
  data.globetrotr_plan = matched?.[1] ?? null;
  data.globetrotr_billing_mode = matched?.[2] ?? null;
  // Paddle tekent de webhook, maar custom_data komt oorspronkelijk uit de
  // browser. Accepteer een workspace alleen met onze serverhandtekening.
  data.custom_data = trustedPaddleCustomData(
    data.custom_data,
    env.PADDLE_CHECKOUT_BINDING_SECRET,
    data.globetrotr_plan,
    data.globetrotr_billing_mode,
  );
  if ((event.event_type || "").startsWith("subscription.") && !data.globetrotr_plan)
    throw Object.assign(new Error("PADDLE_PRICE_NOT_ALLOWED"), {
      code: "PADDLE_PRICE_NOT_ALLOWED",
    });
  if (event.event_type === "transaction.completed" && env.PADDLE_API_KEY && data.id) {
    const base =
      env.VITE_PADDLE_ENVIRONMENT === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com";
    try {
      const invoice = await fetch(`${base}/transactions/${encodeURIComponent(data.id)}/invoice`, {
        headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (invoice.ok) data.globetrotr_invoice_url = (await invoice.json())?.data?.url || null;
    } catch {}
  }
  return event;
}

function required(name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
function boundedNumber(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.min(maximum, Math.max(minimum, Math.floor(parsed)))
    : fallback;
}
function log(level, event, details = {}) {
  process.stdout.write(
    `${JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...details })}\n`,
  );
}
async function rpc(name, body = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      ...serviceAuthHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const error = new Error(`RPC_${name}_${response.status}`);
    error.code = `RPC_${response.status}`;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
async function relayFailure(response) {
  let detail = {};
  try {
    detail = await response.json();
  } catch {}
  const relayCode = String(detail?.error ?? "")
    .replace(/[^A-Z0-9_]/gi, "_")
    .slice(0, 40);
  const smtpCode = Number.isInteger(detail?.smtpResponseCode)
    ? `SMTP_${detail.smtpResponseCode}`
    : `HTTP_${response.status}`;
  return Object.assign(new Error("MAIL_RELAY_FAILED"), {
    code: relayCode ? `${smtpCode}_${relayCode}`.slice(0, 80) : smtpCode,
  });
}

async function handleJob(job) {
  if (job.job_type === "notification.maintenance") {
    await rpc("run_notification_maintenance", { p_now: new Date().toISOString() });
    return;
  }
  if (job.job_type === "provider.healthcheck") {
    const url = typeof job.payload?.url === "string" ? job.payload.url : "";
    const target = new URL(url);
    const allowedHosts = new Set(
      (env.WORKER_HEALTHCHECK_HOSTS ?? "")
        .split(",")
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean),
    );
    if (target.protocol !== "https:" || !allowedHosts.has(target.hostname.toLowerCase()))
      throw Object.assign(new Error("INVALID_HEALTHCHECK_URL"), { code: "INVALID_PAYLOAD" });
    const response = await fetch(target, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok)
      throw Object.assign(new Error("PROVIDER_UNAVAILABLE"), { code: `HTTP_${response.status}` });
    return;
  }
  throw Object.assign(new Error("UNSUPPORTED_JOB_TYPE"), { code: "UNSUPPORTED_JOB_TYPE" });
}

async function pollJobs() {
  const jobs = await rpc("claim_worker_jobs", { p_limit: batchSize });
  for (const job of jobs ?? []) {
    try {
      await handleJob(job);
      await rpc("complete_worker_job", { p_job_id: job.id, p_succeeded: true, p_error_code: null });
      log("info", "job.completed", {
        jobId: job.id,
        jobType: job.job_type,
        provider: job.provider,
      });
    } catch (error) {
      const code = String(error?.code ?? "WORKER_FAILED").slice(0, 80);
      await rpc("complete_worker_job", {
        p_job_id: job.id,
        p_succeeded: false,
        p_error_code: code,
      });
      log("error", "job.failed", {
        jobId: job.id,
        jobType: job.job_type,
        provider: job.provider,
        errorCode: code,
      });
    }
  }
}

async function pollMail() {
  const relayUrl = env.MAIL_DELIVERY_RELAY_URL?.trim();
  const relayToken = env.MAIL_DELIVERY_RELAY_TOKEN?.trim();
  if (!relayUrl || !relayToken) return;
  const messages = await rpc("claim_email_outbox", { p_limit: batchSize });
  for (const message of messages ?? []) {
    try {
      const response = await fetch(relayUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${relayToken}`,
          "Content-Type": "application/json",
          "Idempotency-Key": message.id,
        },
        body: JSON.stringify({
          id: message.id,
          to: message.recipient_email,
          locale: message.locale,
          templateKey: message.template_key,
          payload: message.payload,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw await relayFailure(response);
      await updateOutbox(message.id, "sent", null);
      log("info", "mail.sent", { messageId: message.id, templateKey: message.template_key });
    } catch (error) {
      const code = String(error?.code ?? "MAIL_RELAY_FAILED").slice(0, 80);
      await updateOutbox(message.id, "failed", code);
      log("error", "mail.failed", {
        messageId: message.id,
        templateKey: message.template_key,
        errorCode: code,
      });
    }
  }
}

async function pollWebPush() {
  const publicKey=env.VAPID_PUBLIC_KEY?.trim(),privateKey=env.VAPID_PRIVATE_KEY?.trim(),subject=env.VAPID_SUBJECT?.trim();
  if(!publicKey||!privateKey||!subject)return;
  webPush.setVapidDetails(subject,publicKey,privateKey);
  const messages=await rpc("claim_web_push_outbox",{p_limit:Math.min(batchSize,50)});
  for(const message of messages??[]){
    let gone=false;
    try{
      const subscription=await restSingle(`web_push_subscriptions?id=eq.${encodeURIComponent(message.subscription_id)}&revoked_at=is.null&select=endpoint,p256dh,auth_secret`);
      if(!subscription?.endpoint)throw Object.assign(new Error("PUSH_SUBSCRIPTION_GONE"),{code:"PUSH_SUBSCRIPTION_GONE",statusCode:410});
      await webPush.sendNotification({endpoint:subscription.endpoint,keys:{p256dh:subscription.p256dh,auth:subscription.auth_secret}},JSON.stringify(message.payload),{TTL:3600,urgency:"normal"});
      await rpc("complete_web_push_outbox",{p_id:message.id,p_succeeded:true,p_error_code:null,p_gone:false});
      log("info","push.sent",{messageId:message.id});
    }catch(error){
      const status=Number(error?.statusCode||0);gone=status===404||status===410;const code=gone?"PUSH_SUBSCRIPTION_GONE":status?`PUSH_HTTP_${status}`:String(error?.code||"PUSH_DELIVERY_FAILED").slice(0,80);
      await rpc("complete_web_push_outbox",{p_id:message.id,p_succeeded:false,p_error_code:code,p_gone:gone});
      log("error","push.failed",{messageId:message.id,errorCode:code,gone});
    }
  }
}

function webPushConfiguration() {
  return {
    publicKey: Boolean(env.VAPID_PUBLIC_KEY?.trim()),
    privateKey: Boolean(env.VAPID_PRIVATE_KEY?.trim()),
    subject: Boolean(env.VAPID_SUBJECT?.trim()),
  };
}

function flightState(payload){
  const clean=value=>typeof value==="string"?value.trim().slice(0,120)||null:null;
  const point=value=>value&&typeof value==="object"?{scheduled:clean(value.scheduled_time),actual:clean(value.actual_time),estimated:clean(value.estimated_time),terminal:clean(value.terminal),gate:clean(value.gate)}:{};
  return{status:clean(payload?.status),departure:point(payload?.departure),arrival:point(payload?.arrival)};
}

async function pollFlightMonitors(){
  const key=env.SKYLINK_API_KEY?.trim();if(!key)return;
  const flights=await rpc("claim_due_flight_monitors",{p_limit:Math.min(batchSize,20)});
  for(const flight of flights??[]){
    try{
      const response=await fetch(`https://data.skylinkapi.com/v3.1/flight_status/${encodeURIComponent(flight.flight_number)}`,{headers:{"x-api-key":key},signal:AbortSignal.timeout(15_000)});
      if(!response.ok)throw Object.assign(new Error("FLIGHT_PROVIDER_FAILED"),{code:`FLIGHT_HTTP_${response.status}`});
      const payload=await response.json();if(!payload?.flight_number)throw Object.assign(new Error("FLIGHT_RESPONSE_INVALID"),{code:"FLIGHT_RESPONSE_INVALID"});
      const result=await rpc("record_flight_monitor_result",{p_trip:flight.trip_uuid,p_item:flight.travel_item_id,p_state:flightState(payload),p_error_code:null});
      log("info","flight.checked",{tripId:flight.trip_uuid,itemId:flight.travel_item_id,result});
    }catch(error){
      const code=String(error?.name==="TimeoutError"?"FLIGHT_TIMEOUT":error?.code||"FLIGHT_PROVIDER_FAILED").slice(0,80);
      await rpc("record_flight_monitor_result",{p_trip:flight.trip_uuid,p_item:flight.travel_item_id,p_state:{},p_error_code:code});
      log("error","flight.check_failed",{tripId:flight.trip_uuid,itemId:flight.travel_item_id,errorCode:code});
    }
  }
}

async function pollMailboxProvisioning() {
  const url = env.STALWART_URL?.trim(), token = env.STALWART_API_TOKEN?.trim(),
    domainId = env.STALWART_DOMAIN_ID?.trim();
  if (!url || !token || !domainId) return;
  const mailboxes = await rpc("claim_mailbox_provisioning", { p_limit: Math.min(batchSize, 20) });
  for (const mailbox of mailboxes ?? []) {
    try {
      if (!mailbox.imap_password_ciphertext)
        throw Object.assign(new Error("MAILBOX_PASSWORD_MISSING"), { code: "MAILBOX_PASSWORD_MISSING" });
      const password = decryptMailboxPassword(mailbox.imap_password_ciphertext, env.MAILBOX_CREDENTIALS_KEY);
      const accountId = await provisionMailbox({ url, token, domainId }, mailbox, password);
      await rpc("complete_mailbox_provisioning", { p_mailbox_id: mailbox.id, p_succeeded: true, p_account_id: accountId, p_error_code: null });
      log("info", "mailbox.provisioned", { mailboxId: mailbox.id, mailboxType: mailbox.mailbox_type });
    } catch (error) {
      const code = String(error?.code || "MAIL_PROVISIONING_FAILED").slice(0, 80);
      await rpc("complete_mailbox_provisioning", { p_mailbox_id: mailbox.id, p_succeeded: false, p_account_id: null, p_error_code: code });
      log("error", "mailbox.provisioning_failed", { mailboxId: mailbox.id, errorCode: code });
    }
  }
}

async function pollCorporateMail() {
  const relayUrl = env.MAIL_DELIVERY_RELAY_URL?.trim();
  const relayToken = env.MAIL_DELIVERY_RELAY_TOKEN?.trim();
  if (!relayUrl || !relayToken) return;
  const messages = await rpc("claim_corporate_mail_queue", { p_limit: Math.min(batchSize, 50) });
  for (const message of messages ?? []) {
    try {
      const mailbox = await restSingle(
        `corporate_mailboxes?id=eq.${encodeURIComponent(message.mailbox_id)}&select=address,display_name`,
      );
      if (!mailbox?.address)
        throw Object.assign(new Error("MAILBOX_NOT_FOUND"), { code: "MAILBOX_NOT_FOUND" });
      const parent = message.in_reply_to_message_id
        ? await restSingle(
            `corporate_mail_messages?id=eq.${encodeURIComponent(message.in_reply_to_message_id)}&select=provider_message_id,thread_key`,
          )
        : null;
      const attachmentRows = await restRead(
        `corporate_mail_attachments?send_queue_id=eq.${encodeURIComponent(message.id)}&select=id,storage_key,file_name,content_type,size_bytes,sha256`,
      );
      const attachments = [];
      let attachmentBytes = 0;
      for (const attachment of attachmentRows ?? []) {
        attachmentBytes += Number(attachment.size_bytes || 0);
        if (attachmentBytes > 20 * 1024 * 1024)
          throw Object.assign(new Error("ATTACHMENTS_TOO_LARGE"), { code: "ATTACHMENTS_TOO_LARGE" });
        const path = String(attachment.storage_key)
          .split("/")
          .map(encodeURIComponent)
          .join("/");
        const file = await fetch(`${supabaseUrl}/storage/v1/object/authenticated/corporate-mail/${path}`, {
          headers: { ...serviceAuthHeaders },
          signal: AbortSignal.timeout(20_000),
        });
        if (!file.ok)
          throw Object.assign(new Error("ATTACHMENT_READ_FAILED"), { code: `STORAGE_${file.status}` });
        const content = Buffer.from(await file.arrayBuffer());
        if (content.length !== Number(attachment.size_bytes) || createHash("sha256").update(content).digest("hex") !== attachment.sha256)
          throw Object.assign(new Error("ATTACHMENT_INTEGRITY_FAILED"), { code: "ATTACHMENT_INTEGRITY_FAILED" });
        await scanBuffer(content);
        attachments.push({
          filename: attachment.file_name,
          contentType: attachment.content_type,
          content: content.toString("base64"),
        });
      }
      const response = await fetch(relayUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${relayToken}`,
          "Content-Type": "application/json",
          "Idempotency-Key": message.id,
        },
        body: JSON.stringify({
          id: message.id,
          from: { address: mailbox.address, name: mailbox.display_name },
          to: message.recipient_addresses,
          cc: message.cc_addresses,
          subject: message.subject,
          text: message.body_text,
          html: message.body_html,
          inReplyTo: parent?.provider_message_id || undefined,
          references: parent?.thread_key || parent?.provider_message_id || undefined,
          attachments,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw await relayFailure(response);
      await updateCorporateOutbox(message, mailbox.address, "sent", null, parent);
      log("info", "corporate_mail.sent", {
        messageId: message.id,
        mailboxId: message.mailbox_id,
        recipientCount: message.recipient_addresses.length,
      });
    } catch (error) {
      const code = String(error?.code ?? "MAIL_RELAY_FAILED").slice(0, 80);
      const permanent = new Set([
        "MALWARE_DETECTED",
        "MALWARE_SCAN_INVALID_FILE",
        "ATTACHMENT_INTEGRITY_FAILED",
        "ATTACHMENTS_TOO_LARGE",
      ]).has(code);
      await updateCorporateOutbox(message, null, permanent ? "cancelled" : "failed", code);
      log("error", "corporate_mail.failed", {
        messageId: message.id,
        mailboxId: message.mailbox_id,
        errorCode: code,
        permanent,
      });
    }
  }
}

async function restSingle(path) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      ...serviceAuthHeaders,
      Accept: "application/vnd.pgrst.object+json",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw Object.assign(new Error("REST_READ_FAILED"), { code: `REST_${response.status}` });
  return response.json();
}

async function restRead(path) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { ...serviceAuthHeaders },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw Object.assign(new Error("REST_READ_FAILED"), { code: `REST_${response.status}` });
  return response.json();
}

async function cleanupExpiredCorporateMailUploads() {
  const expired = await restRead(
    `corporate_mail_uploads?expires_at=lt.${encodeURIComponent(new Date().toISOString())}&select=id,storage_key&order=expires_at.asc&limit=100`,
  );
  if (!expired?.length) return;
  const storage = await fetch(`${supabaseUrl}/storage/v1/object/corporate-mail`, {
    method: "DELETE",
    headers: {
      ...serviceAuthHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: expired.map((row) => row.storage_key) }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!storage.ok)
    throw Object.assign(new Error("ATTACHMENT_CLEANUP_FAILED"), { code: `STORAGE_${storage.status}` });
  const removed = await fetch(
    `${supabaseUrl}/rest/v1/corporate_mail_uploads?id=in.(${expired.map((row) => row.id).join(",")})`,
    {
      method: "DELETE",
      headers: {
        ...serviceAuthHeaders,
        Prefer: "return=minimal",
      },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!removed.ok)
    throw Object.assign(new Error("ATTACHMENT_CLEANUP_RECORD_FAILED"), { code: `REST_${removed.status}` });
  log("info", "corporate_mail.uploads_cleaned", { count: expired.length });
}

async function updateCorporateOutbox(message, senderAddress, status, errorCode, parent = null) {
  const now = new Date().toISOString();
  const response = await fetch(
    `${supabaseUrl}/rest/v1/corporate_mail_send_queue?id=eq.${encodeURIComponent(message.id)}&status=eq.processing`,
    {
      method: "PATCH",
      headers: {
        ...serviceAuthHeaders,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status,
        sent_at: status === "sent" ? now : null,
        last_error_code: errorCode,
        available_at:
          status === "failed" ? new Date(Date.now() + 60_000).toISOString() : message.available_at,
        updated_at: now,
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok)
    throw Object.assign(new Error("CORPORATE_OUTBOX_UPDATE_FAILED"), {
      code: `REST_${response.status}`,
    });
  if (status !== "sent") return;
  const recorded = await fetch(`${supabaseUrl}/rest/v1/corporate_mail_messages`, {
    method: "POST",
    headers: {
      ...serviceAuthHeaders,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      mailbox_id: message.mailbox_id,
      provider_message_id: `outbox:${message.id}`,
      thread_key: parent?.thread_key || parent?.provider_message_id || `outbox:${message.id}`,
      direction: "outbound",
      sender_address: senderAddress,
      recipient_addresses: message.recipient_addresses,
      subject: message.subject,
      preview_text: message.body_text.slice(0, 1000),
      body_text: message.body_text,
      body_html: message.body_html,
      received_at: now,
      read_at: now,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!recorded.ok && recorded.status !== 409)
    throw Object.assign(new Error("SENT_MESSAGE_RECORD_FAILED"), {
      code: `REST_${recorded.status}`,
    });
  if (recorded.ok) {
    const rows = await recorded.json();
    const recordedId = rows?.[0]?.id;
    if (recordedId) {
      const moved = await fetch(
        `${supabaseUrl}/rest/v1/corporate_mail_attachments?send_queue_id=eq.${encodeURIComponent(message.id)}`,
        {
          method: "PATCH",
          headers: {
            ...serviceAuthHeaders,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ message_id: recordedId, send_queue_id: null }),
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (!moved.ok)
        throw Object.assign(new Error("SENT_ATTACHMENT_RECORD_FAILED"), { code: `REST_${moved.status}` });
    }
  }
}

async function updateOutbox(id, status, errorCode) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/email_outbox?id=eq.${encodeURIComponent(id)}&status=eq.processing`,
    {
      method: "PATCH",
      headers: {
        ...serviceAuthHeaders,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
        last_error_code: errorCode,
        available_at: status === "failed" ? new Date(Date.now() + 60_000).toISOString() : undefined,
        updated_at: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok)
    throw Object.assign(new Error("OUTBOX_UPDATE_FAILED"), { code: `RPC_${response.status}` });
}

async function cycle() {
  lastPollAt = new Date().toISOString();
  try {
    await pollJobs();
    await pollMail();
    await pollWebPush();
    await pollMailboxProvisioning();
    await pollCorporateMail();
    if (Date.now() - lastEntitlementExpiryAt > 3_600_000) {
      await rpc("expire_billing_entitlements");
      lastEntitlementExpiryAt = Date.now();
    }
    if (Date.now() - lastAttachmentCleanupAt > 3_600_000) {
      await cleanupExpiredCorporateMailUploads();
      lastAttachmentCleanupAt = Date.now();
    }
    if (Date.now() - lastTripPollReminderAt > 3_600_000) {
      await rpc("run_trip_option_poll_reminders", { p_now: new Date().toISOString() });
      lastTripPollReminderAt = Date.now();
    }
    if (Date.now() - lastAgencyFormCleanupAt > 3_600_000) {
      await rpc("cleanup_expired_agency_form_data", { p_now: new Date().toISOString() });
      lastAgencyFormCleanupAt = Date.now();
    }
    if (Date.now() - lastBookingMailCleanupAt > 3_600_000) {
      await rpc("cleanup_trip_booking_mail_drafts");
      lastBookingMailCleanupAt = Date.now();
    }
    if (Date.now() - lastPushCleanupAt > 3_600_000) {
      await rpc("cleanup_web_push_data");
      lastPushCleanupAt = Date.now();
    }
    if (Date.now() - lastFlightMonitorAt > 60_000) {
      await pollFlightMonitors();
      lastFlightMonitorAt = Date.now();
    }
    lastSuccessAt = new Date().toISOString();
    lastErrorCode = null;
  } catch (error) {
    lastErrorCode = String(error?.code ?? "WORKER_CYCLE_FAILED").slice(0, 80);
    log("error", "worker.cycle_failed", { errorCode: lastErrorCode });
  }
}
createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", "http://worker");
  if (requestUrl.pathname === "/api/paddle/webhook") {
    if (request.method !== "POST") {
      response.writeHead(405, { Allow: "POST" }).end();
      return;
    }
    const secret = env.PADDLE_WEBHOOK_SECRET?.trim();
    if (!secret) {
      response
        .writeHead(503, { "Content-Type": "application/json" })
        .end('{"error":"PADDLE_NOT_CONFIGURED"}');
      return;
    }
    try {
      const rawBody = await readRequestBody(request);
      if (!validPaddleSignature(rawBody, request.headers["paddle-signature"], secret)) {
        response
          .writeHead(401, { "Content-Type": "application/json", "Cache-Control": "no-store" })
          .end('{"error":"INVALID_SIGNATURE"}');
        return;
      }
      const event = await enrichPaddleEvent(JSON.parse(rawBody));
      if (event.event_type === "transaction.completed" &&
          event.data?.custom_data?.checkout_binding &&
          !event.data?.globetrotr_plan) {
        log("error", "paddle.price_unrecognized", {
          eventId: event.event_id,
          transactionId: event.data?.id,
        });
        response.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" })
          .end('{"error":"PADDLE_PRICE_NOT_ALLOWED"}');
        return;
      }
      if (event.event_type === "transaction.completed" &&
          event.data?.globetrotr_billing_mode === "one_time" &&
          !event.data?.custom_data?.workspace_uuid) {
        log("error", "paddle.checkout_binding_unverified", {
          eventId: event.event_id,
          transactionId: event.data?.id,
          priceMatched: Boolean(event.data?.globetrotr_plan),
          bindingPresent: Boolean(event.data?.custom_data?.checkout_binding),
        });
        response.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" })
          .end('{"error":"CHECKOUT_BINDING_UNVERIFIED"}');
        return;
      }
      const result = await rpc("process_paddle_billing_event", { p_event: event });
      // A previous delivery may have committed the event before entitlement creation failed.
      // Re-run the idempotent entitlement step on verified Paddle retries.
      if (
        ["processed", "duplicate"].includes(result) &&
        event.data?.globetrotr_billing_mode === "one_time"
      )
        await rpc("apply_paddle_one_time_purchase", { p_event: event });
      if (
        ["processed", "duplicate"].includes(result) &&
        /^(transaction|adjustment)\./.test(event.event_type || "")
      )
        await rpc("reconcile_paddle_one_time_purchase", { p_event: event });
      log("info", "paddle.webhook", {
        eventId: event.event_id,
        eventType: event.event_type,
        result,
      });
      response
        .writeHead(result === "failed" ? 500 : 200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        })
        .end(JSON.stringify({ status: result }));
    } catch (error) {
      const code = String(error?.code ?? "PADDLE_WEBHOOK_FAILED").slice(0, 80);
      log("error", "paddle.webhook_failed", { errorCode: code });
      response
        .writeHead(code === "REQUEST_TOO_LARGE" ? 413 : 400, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        })
        .end(JSON.stringify({ error: code }));
    }
    return;
  }
  if (
    (request.method === "GET" || request.method === "HEAD") &&
    /^\/calendar\/[A-Za-z0-9_-]{32,200}\.ics$/.test(requestUrl.pathname)
  ) {
    const token = requestUrl.pathname.slice("/calendar/".length, -4);
    try {
      const calendar = await rpc("get_trip_calendar_feed", { p_token: token });
      if (!calendar) {
        log("warn", "calendar.feed_unavailable", { reason: "token_revoked_or_plan_inactive" });
        response.writeHead(404).end();
        return;
      }
      const body = buildLiveCalendar(calendar);
      const etag = `"${createHash("sha256").update(body).digest("base64url")}"`;
      if (request.headers["if-none-match"] === etag) {
        response.writeHead(304, { ETag: etag, "Cache-Control": "private, max-age=300, must-revalidate" }).end();
        return;
      }
      response
        .writeHead(200, {
          "Content-Type": "text/calendar; charset=utf-8",
          "Cache-Control": "private, max-age=300, must-revalidate",
          ETag: etag,
          "Last-Modified": new Date(calendar.updated_at ?? Date.now()).toUTCString(),
          "Content-Disposition": `inline; filename="${String(calendar.name).replace(/[^a-z0-9_-]/gi, "-")}.ics"`,
        })
        .end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      log("error", "calendar.feed_failed", {
        errorCode: String(error?.code || "CALENDAR_FEED_FAILED").slice(0, 80),
      });
      response.writeHead(503, { "Cache-Control": "no-store" }).end();
    }
    return;
  }
  if (requestUrl.pathname === "/tls/ask") {
    const domain = String(requestUrl.searchParams.get("domain") || "").toLowerCase();
    const now = Date.now(),
      recent = (tlsChecks.get(domain) || []).filter((time) => now - time < 60_000);
    recent.push(now);
    tlsChecks.set(domain, recent);
    if (!/^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])$/.test(domain) || recent.length > 10) {
      response.writeHead(429).end();
      return;
    }
    try {
        const workspaceId = await activeAgencyWorkspaceForDomain(domain);
        response.writeHead(workspaceId ? 204 : 403, { "Cache-Control": "no-store" }).end();
    } catch {
      response.writeHead(503, { "Cache-Control": "no-store" }).end();
    }
    return;
  }
  if (requestUrl.pathname === "/agency/entry") {
    const domain = String(requestUrl.searchParams.get("domain") || "").toLowerCase();
    try {
      const workspaceId = await activeAgencyWorkspaceForDomain(domain);
      if (!workspaceId) {
        response.writeHead(404, { "Cache-Control": "no-store" }).end();
        return;
      }
      response.writeHead(302, {
        Location: `/agency-admin?workspace=${encodeURIComponent(workspaceId)}`,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      }).end();
    } catch {
      response.writeHead(503, { "Cache-Control": "no-store" }).end();
    }
    return;
  }
  if (requestUrl.pathname === "/health/mail") {
    const config={url:env.STALWART_URL?.trim(),token:env.STALWART_API_TOKEN?.trim(),domainId:env.STALWART_DOMAIN_ID?.trim()};
    if(!config.url||!config.token||!config.domainId){response.writeHead(503,{"Content-Type":"application/json","Cache-Control":"no-store"}).end(JSON.stringify({status:"not_configured"}));return}
    try{await checkStalwart(config);response.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"}).end(JSON.stringify({status:"operational"}))}
    catch(error){log("error","mail_server.health_failed",{errorCode:String(error?.code||"MAIL_SERVER_UNAVAILABLE").slice(0,80)});response.writeHead(503,{"Content-Type":"application/json","Cache-Control":"no-store"}).end(JSON.stringify({status:"unavailable"}))}
    return;
  }
  if (requestUrl.pathname === "/health/push") {
    const configuration = webPushConfiguration();
    const configured = Object.values(configuration).every(Boolean);
    response.writeHead(configured ? 200 : 503, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    }).end(JSON.stringify({ status: configured ? "configured" : "not_configured", configuration }));
    return;
  }
  if (request.url !== "/health") {
    response.writeHead(404).end();
    return;
  }
  const healthy =
    Boolean(lastSuccessAt) &&
    Date.now() - Date.parse(lastSuccessAt) < Math.max(120_000, pollMs * 4);
  response.writeHead(healthy ? 200 : 503, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  response.end(
    JSON.stringify({
      status: healthy ? "ok" : "degraded",
      lastPollAt,
      lastSuccessAt,
      lastErrorCode,
      webPush: Object.values(webPushConfiguration()).every(Boolean) ? "configured" : "not_configured",
    }),
  );
}).listen(healthPort, "0.0.0.0", () =>
  log("info", "worker.started", {
    pollMs,
    batchSize,
    healthPort,
    mailRelayConfigured: Boolean(env.MAIL_DELIVERY_RELAY_URL && env.MAIL_DELIVERY_RELAY_TOKEN),
  }),
);
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
while (!stopping) {
  await cycle();
  await new Promise((resolve) => setTimeout(resolve, pollMs));
}
log("info", "worker.stopped");
