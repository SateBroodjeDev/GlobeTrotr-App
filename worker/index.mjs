import { createServer } from "node:http";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { scanBuffer } from "./clamav.mjs";
import { buildLiveCalendar } from "./live-calendar.mjs";
import { trustedPaddleCustomData } from "./paddle-binding.mjs";

const env = process.env;
const supabaseUrl = required("SUPABASE_URL").replace(/\/$/, "");
const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
const pollMs = boundedNumber(env.WORKER_POLL_MS, 5_000, 1_000, 60_000);
const batchSize = boundedNumber(env.WORKER_BATCH_SIZE, 20, 1, 100);
const healthPort = boundedNumber(env.WORKER_HEALTH_PORT, 9091, 1, 65_535);
let stopping = false;
let lastPollAt = null;
let lastSuccessAt = null;
let lastErrorCode = null;
let lastEntitlementExpiryAt = 0;
let lastAttachmentCleanupAt = 0;
const tlsChecks = new Map();

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
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
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
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
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
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
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
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
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
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
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
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
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
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
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
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
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
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
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
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
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
    await pollCorporateMail();
    if (Date.now() - lastEntitlementExpiryAt > 3_600_000) {
      await rpc("expire_billing_entitlements");
      lastEntitlementExpiryAt = Date.now();
    }
    if (Date.now() - lastAttachmentCleanupAt > 3_600_000) {
      await cleanupExpiredCorporateMailUploads();
      lastAttachmentCleanupAt = Date.now();
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
    request.method === "GET" &&
    /^\/calendar\/[A-Za-z0-9_-]{32,200}\.ics$/.test(requestUrl.pathname)
  ) {
    const token = requestUrl.pathname.slice("/calendar/".length, -4);
    try {
      const calendar = await rpc("get_trip_calendar_feed", { p_token: token });
      if (!calendar) {
        response.writeHead(404).end();
        return;
      }
      const body = buildLiveCalendar(calendar);
      response
        .writeHead(200, {
          "Content-Type": "text/calendar; charset=utf-8",
          "Cache-Control": "no-store",
          "Content-Disposition": `inline; filename="${String(calendar.name).replace(/[^a-z0-9_-]/gi, "-")}.ics"`,
        })
        .end(body);
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
    const check = await fetch(
      `${supabaseUrl}/rest/v1/agency_domains?custom_domain=eq.${encodeURIComponent(domain)}&verification_status=eq.verified&select=custom_domain&limit=1`,
      {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        signal: AbortSignal.timeout(3000),
      },
    );
    const allowed = check.ok && (await check.json()).length === 1;
    response.writeHead(allowed ? 204 : 403, { "Cache-Control": "no-store" }).end();
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
