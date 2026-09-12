import { createServer } from "node:http";

const env = process.env;
const supabaseUrl = required("SUPABASE_URL").replace(/\/$/, "");
const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
const pollMs = boundedNumber(env.WORKER_POLL_MS, 5_000, 1_000, 60_000);
const batchSize = boundedNumber(env.WORKER_BATCH_SIZE, 20, 1, 100);
const healthPort = boundedNumber(env.WORKER_HEALTH_PORT, 9091, 1, 65_535);
let stopping = false; let lastPollAt = null; let lastSuccessAt = null; let lastErrorCode = null;

function required(name) { const value = env[name]?.trim(); if (!value) throw new Error(`Missing ${name}`); return value; }
function boundedNumber(value, fallback, minimum, maximum) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, Math.floor(parsed))) : fallback; }
function log(level, event, details = {}) { process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...details })}\n`); }
async function rpc(name, body = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(15_000) });
  if (!response.ok) { const error = new Error(`RPC_${name}_${response.status}`); error.code = `RPC_${response.status}`; throw error; }
  return response.status === 204 ? null : response.json();
}

async function handleJob(job) {
  if (job.job_type === "notification.maintenance") { await rpc("run_notification_maintenance", { p_now: new Date().toISOString() }); return; }
  if (job.job_type === "provider.healthcheck") {
    const url = typeof job.payload?.url === "string" ? job.payload.url : "";
    const target = new URL(url);
    const allowedHosts = new Set((env.WORKER_HEALTHCHECK_HOSTS ?? "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean));
    if (target.protocol !== "https:" || !allowedHosts.has(target.hostname.toLowerCase())) throw Object.assign(new Error("INVALID_HEALTHCHECK_URL"), { code: "INVALID_PAYLOAD" });
    const response = await fetch(target, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw Object.assign(new Error("PROVIDER_UNAVAILABLE"), { code: `HTTP_${response.status}` });
    return;
  }
  throw Object.assign(new Error("UNSUPPORTED_JOB_TYPE"), { code: "UNSUPPORTED_JOB_TYPE" });
}

async function pollJobs() {
  const jobs = await rpc("claim_worker_jobs", { p_limit: batchSize });
  for (const job of jobs ?? []) {
    try { await handleJob(job); await rpc("complete_worker_job", { p_job_id: job.id, p_succeeded: true, p_error_code: null }); log("info", "job.completed", { jobId: job.id, jobType: job.job_type, provider: job.provider }); }
    catch (error) { const code = String(error?.code ?? "WORKER_FAILED").slice(0, 80); await rpc("complete_worker_job", { p_job_id: job.id, p_succeeded: false, p_error_code: code }); log("error", "job.failed", { jobId: job.id, jobType: job.job_type, provider: job.provider, errorCode: code }); }
  }
}

async function pollMail() {
  const relayUrl = env.MAIL_DELIVERY_RELAY_URL?.trim(); const relayToken = env.MAIL_DELIVERY_RELAY_TOKEN?.trim();
  if (!relayUrl || !relayToken) return;
  const messages = await rpc("claim_email_outbox", { p_limit: batchSize });
  for (const message of messages ?? []) {
    try {
      const response = await fetch(relayUrl, { method: "POST", headers: { Authorization: `Bearer ${relayToken}`, "Content-Type": "application/json", "Idempotency-Key": message.id }, body: JSON.stringify({ id: message.id, to: message.recipient_email, locale: message.locale, templateKey: message.template_key, payload: message.payload }), signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw Object.assign(new Error("MAIL_RELAY_FAILED"), { code: `HTTP_${response.status}` });
      await updateOutbox(message.id, "sent", null);
      log("info", "mail.sent", { messageId: message.id, templateKey: message.template_key });
    } catch (error) { const code = String(error?.code ?? "MAIL_RELAY_FAILED").slice(0, 80); await updateOutbox(message.id, "failed", code); log("error", "mail.failed", { messageId: message.id, templateKey: message.template_key, errorCode: code }); }
  }
}

async function pollCorporateMail() {
  const relayUrl = env.MAIL_DELIVERY_RELAY_URL?.trim(); const relayToken = env.MAIL_DELIVERY_RELAY_TOKEN?.trim();
  if (!relayUrl || !relayToken) return;
  const messages = await rpc("claim_corporate_mail_queue", { p_limit: Math.min(batchSize, 50) });
  for (const message of messages ?? []) {
    try {
      const mailbox = await restSingle(`corporate_mailboxes?id=eq.${encodeURIComponent(message.mailbox_id)}&select=address,display_name`);
      if (!mailbox?.address) throw Object.assign(new Error("MAILBOX_NOT_FOUND"), { code: "MAILBOX_NOT_FOUND" });
      const response = await fetch(relayUrl, { method: "POST", headers: { Authorization: `Bearer ${relayToken}`, "Content-Type": "application/json", "Idempotency-Key": message.id }, body: JSON.stringify({ id: message.id, from: { address: mailbox.address, name: mailbox.display_name }, to: message.recipient_addresses, cc: message.cc_addresses, subject: message.subject, text: message.body_text }), signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw Object.assign(new Error("MAIL_RELAY_FAILED"), { code: `HTTP_${response.status}` });
      await updateCorporateOutbox(message, mailbox.address, "sent", null);
      log("info", "corporate_mail.sent", { messageId: message.id, mailboxId: message.mailbox_id, recipientCount: message.recipient_addresses.length });
    } catch (error) { const code = String(error?.code ?? "MAIL_RELAY_FAILED").slice(0, 80); await updateCorporateOutbox(message, null, "failed", code); log("error", "corporate_mail.failed", { messageId: message.id, mailboxId: message.mailbox_id, errorCode: code }); }
  }
}

async function restSingle(path) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Accept: "application/vnd.pgrst.object+json" }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw Object.assign(new Error("REST_READ_FAILED"), { code: `REST_${response.status}` });
  return response.json();
}

async function updateCorporateOutbox(message, senderAddress, status, errorCode) {
  const now = new Date().toISOString();
  const response = await fetch(`${supabaseUrl}/rest/v1/corporate_mail_send_queue?id=eq.${encodeURIComponent(message.id)}&status=eq.processing`, { method: "PATCH", headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ status, sent_at: status === "sent" ? now : null, last_error_code: errorCode, available_at: status === "failed" ? new Date(Date.now() + 60_000).toISOString() : message.available_at, updated_at: now }), signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw Object.assign(new Error("CORPORATE_OUTBOX_UPDATE_FAILED"), { code: `REST_${response.status}` });
  if (status !== "sent") return;
  const recorded = await fetch(`${supabaseUrl}/rest/v1/corporate_mail_messages`, { method: "POST", headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ mailbox_id: message.mailbox_id, provider_message_id: `outbox:${message.id}`, direction: "outbound", sender_address: senderAddress, recipient_addresses: message.recipient_addresses, subject: message.subject, preview_text: message.body_text.slice(0, 1000), received_at: now, read_at: now }), signal: AbortSignal.timeout(15_000) });
  if (!recorded.ok && recorded.status !== 409) throw Object.assign(new Error("SENT_MESSAGE_RECORD_FAILED"), { code: `REST_${recorded.status}` });
}

async function updateOutbox(id, status, errorCode) {
  const response = await fetch(`${supabaseUrl}/rest/v1/email_outbox?id=eq.${encodeURIComponent(id)}&status=eq.processing`, { method: "PATCH", headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ status, sent_at: status === "sent" ? new Date().toISOString() : null, last_error_code: errorCode, available_at: status === "failed" ? new Date(Date.now() + 60_000).toISOString() : undefined, updated_at: new Date().toISOString() }), signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw Object.assign(new Error("OUTBOX_UPDATE_FAILED"), { code: `RPC_${response.status}` });
}

async function cycle() { lastPollAt = new Date().toISOString(); try { await pollJobs(); await pollMail(); await pollCorporateMail(); lastSuccessAt = new Date().toISOString(); lastErrorCode = null; } catch (error) { lastErrorCode = String(error?.code ?? "WORKER_CYCLE_FAILED").slice(0, 80); log("error", "worker.cycle_failed", { errorCode: lastErrorCode }); } }
createServer((request, response) => { if (request.url !== "/health") { response.writeHead(404).end(); return; } const healthy = Boolean(lastSuccessAt) && Date.now() - Date.parse(lastSuccessAt) < Math.max(120_000, pollMs * 4); response.writeHead(healthy ? 200 : 503, { "Content-Type": "application/json", "Cache-Control": "no-store" }); response.end(JSON.stringify({ status: healthy ? "ok" : "degraded", lastPollAt, lastSuccessAt, lastErrorCode })); }).listen(healthPort, "0.0.0.0", () => log("info", "worker.started", { pollMs, batchSize, healthPort, mailRelayConfigured: Boolean(env.MAIL_DELIVERY_RELAY_URL && env.MAIL_DELIVERY_RELAY_TOKEN) }));
process.on("SIGTERM", () => { stopping = true; }); process.on("SIGINT", () => { stopping = true; });
while (!stopping) { await cycle(); await new Promise((resolve) => setTimeout(resolve, pollMs)); }
log("info", "worker.stopped");
