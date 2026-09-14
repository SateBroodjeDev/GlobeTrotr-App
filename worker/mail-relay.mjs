import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import nodemailer from "nodemailer";

const env = process.env;
const token = required("MAIL_RELAY_TOKEN");
const port = bounded(env.MAIL_RELAY_PORT, 9092, 1, 65535);
const defaultAddress = required("SMTP_FROM_ADDRESS").toLowerCase();
const defaultName = (env.SMTP_FROM_NAME || "GlobeTrotr").trim().slice(0, 100);
const allowedDomains = new Set((env.SMTP_ALLOWED_FROM_DOMAINS || "globetrotr.nl").split(",").map(v => v.trim().toLowerCase()).filter(Boolean));
const transporter = nodemailer.createTransport({
  host: required("SMTP_HOST"),
  port: bounded(env.SMTP_PORT, 587, 1, 65535),
  secure: env.SMTP_SECURE === "true",
  requireTLS: env.SMTP_REQUIRE_TLS !== "false",
  auth: { user: required("SMTP_USER"), pass: required("SMTP_PASSWORD") },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
  disableFileAccess: true,
  disableUrlAccess: true,
});

function required(name) { const value = env[name]?.trim(); if (!value) throw new Error(`Missing ${name}`); return value; }
function bounded(value, fallback, min, max) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.floor(parsed))) : fallback; }
function equalSecret(value) { const a = Buffer.from(value || ""); const b = Buffer.from(token); return a.length === b.length && timingSafeEqual(a, b); }
function validEmail(value) { return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function addresses(value, maximum = 25) { const list = (Array.isArray(value) ? value : [value]).filter(Boolean); if (!list.length || list.length > maximum || !list.every(validEmail)) throw code("INVALID_RECIPIENTS"); return [...new Set(list.map(v => v.toLowerCase()))]; }
function code(message) { return Object.assign(new Error(message), { code: message }); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function safeFrom(input) {
  const address = input?.address ? String(input.address).trim().toLowerCase() : defaultAddress;
  const domain = address.split("@")[1];
  if (!validEmail(address) || !allowedDomains.has(domain)) throw code("INVALID_SENDER");
  return { address, name: String(input?.name || defaultName).trim().slice(0, 100) };
}
function notificationMessage(body) {
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  const subject = String(payload.title || "Nieuwe melding van GlobeTrotr").trim().slice(0, 160);
  const text = String(payload.body || "Open GlobeTrotr om je nieuwe melding te bekijken.").trim().slice(0, 5000);
  return { subject, text, html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><img src="https://globetrotr.nl/assets/email/logo.png" width="56" height="56" alt="GlobeTrotr" style="display:block;margin-bottom:24px"><h1 style="font-size:22px">${escapeHtml(subject)}</h1><p style="white-space:pre-line;line-height:1.6">${escapeHtml(text)}</p><p><a href="https://globetrotr.nl" style="color:#0f766e">Open GlobeTrotr</a></p></div>` };
}
async function readJson(request) {
  let size = 0; const chunks = [];
  for await (const chunk of request) { size += chunk.length; if (size > 64 * 1024) throw code("BODY_TOO_LARGE"); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw code("INVALID_JSON"); }
}
async function send(body, idempotencyKey) {
  if (!body || typeof body !== "object" || !/^[0-9a-f-]{36}$/i.test(String(body.id || "")) || idempotencyKey !== body.id) throw code("INVALID_MESSAGE_ID");
  const corporate = typeof body.subject === "string" && typeof body.text === "string";
  const content = corporate ? { subject: body.subject.trim().slice(0, 160), text: body.text.trim().slice(0, 20_000) } : notificationMessage(body);
  if (!content.subject || !content.text) throw code("INVALID_CONTENT");
  await transporter.sendMail({
    from: safeFrom(corporate ? body.from : undefined),
    to: addresses(body.to),
    cc: body.cc?.length ? addresses(body.cc) : undefined,
    subject: content.subject,
    text: content.text,
    html: content.html,
    messageId: `<${body.id}@globetrotr.nl>`,
    headers: { "X-GlobeTrotr-Message-ID": body.id },
  });
}

const server = createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "GET" && request.url === "/health") {
    try { await transporter.verify(); response.writeHead(200, { "Content-Type": "application/json" }); response.end('{"status":"ok","smtp":"reachable"}'); }
    catch { response.writeHead(503, { "Content-Type": "application/json" }); response.end('{"status":"degraded","smtp":"unreachable"}'); }
    return;
  }
  if (request.method !== "POST" || request.url !== "/send") { response.writeHead(404).end(); return; }
  if (!equalSecret(String(request.headers.authorization || "").replace(/^Bearer\s+/i, ""))) { response.writeHead(401).end(); return; }
  try { await send(await readJson(request), String(request.headers["idempotency-key"] || "")); response.writeHead(202).end(); }
  catch (error) { const errorCode = String(error?.code || "MAIL_SEND_FAILED").slice(0, 80); process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: "error", event: "relay.send_failed", errorCode })}\n`); response.writeHead(errorCode.startsWith("INVALID_") || errorCode === "BODY_TOO_LARGE" ? 400 : 502).end(); }
});

server.listen(port, "0.0.0.0", async () => {
  try { await transporter.verify(); process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: "info", event: "relay.started", port, smtpVerified: true })}\n`); }
  catch { process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: "error", event: "relay.smtp_unavailable", errorCode: "SMTP_VERIFY_FAILED" })}\n`); }
});
