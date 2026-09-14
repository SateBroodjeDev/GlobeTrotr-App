import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

const env = process.env,
  supabaseUrl = required("SUPABASE_URL").replace(/\/$/, ""),
  serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
const interval = bounded(env.IMAP_SYNC_INTERVAL_MS, 60_000, 15_000, 900_000),
  lookback = bounded(env.IMAP_INITIAL_LOOKBACK_DAYS, 14, 1, 90);
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
function required(name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
function bounded(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.floor(parsed))) : fallback;
}
function log(level, event, details = {}) {
  process.stdout.write(
    `${JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...details })}\n`,
  );
}
function headers(extra = {}) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}
async function rest(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: headers(options.headers),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok)
    throw Object.assign(new Error(`REST_${response.status}`), { code: `REST_${response.status}` });
  if (response.status === 204) return null;
  return response.json();
}
const normalized = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
async function sync() {
  const mailboxes = await rest(
    "corporate_mailboxes?active=eq.true&select=id,address,last_synced_at",
  );
  if (!mailboxes.length) return;
  const byAddress = new Map(mailboxes.map((box) => [normalized(box.address), box]));
  const client = new ImapFlow({
    host: required("IMAP_HOST"),
    port: bounded(env.IMAP_PORT, 993, 1, 65535),
    secure: env.IMAP_SECURE !== "false",
    auth: { user: required("IMAP_USER"), pass: required("IMAP_PASSWORD") },
    logger: false,
    tls: { rejectUnauthorized: env.IMAP_REJECT_UNAUTHORIZED !== "false" },
  });
  await client.connect();
  try {
    const lock = await client.getMailboxLock(env.IMAP_MAILBOX?.trim() || "INBOX");
    try {
      const since = new Date(Date.now() - lookback * 86_400_000);
      const ids = await client.search({ since }, { uid: true });
      const recent = ids.slice(-500);
      if (recent.length)
        for await (const message of client.fetch(
          recent,
          { uid: true, envelope: true, source: true, internalDate: true },
          { uid: true },
        )) {
          const parsed = await simpleParser(message.source);
          const recipients = [...(parsed.to?.value ?? []), ...(parsed.cc?.value ?? [])].map(
            (item) => normalized(item.address),
          );
          const delivered = normalized(
            parsed.headers.get("delivered-to") || parsed.headers.get("x-original-to"),
          );
          if (delivered) recipients.push(delivered);
          const targets = [...new Set(recipients)]
            .map((address) => byAddress.get(address))
            .filter(Boolean);
          if (!targets.length) continue;
          const providerId = String(
            parsed.messageId || `imap:${client.mailbox.uidValidity}:${message.uid}`,
          ).slice(0, 500);
          const body = String(parsed.text || parsed.html || "")
            .replace(/\0/g, "")
            .slice(0, 100_000);
          const sender = normalized(parsed.from?.value?.[0]?.address) || "unknown@globetrotr.nl";
          for (const box of targets) {
            try {
              await rest("corporate_mail_messages", {
                method: "POST",
                headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
                body: JSON.stringify({
                  mailbox_id: box.id,
                  provider_message_id: providerId,
                  thread_key:
                    String(
                      parsed.inReplyTo || parsed.references?.at(-1) || parsed.messageId || "",
                    ).slice(0, 500) || null,
                  direction: "inbound",
                  sender_address: sender,
                  recipient_addresses: [...new Set(recipients)].slice(0, 50),
                  subject: String(parsed.subject || "").slice(0, 500),
                  preview_text: body.slice(0, 1000),
                  body_text: body,
                  received_at: (parsed.date || message.internalDate || new Date()).toISOString(),
                }),
              });
            } catch (error) {
              if (error.code !== "REST_409") throw error;
            }
          }
        }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
  const now = new Date().toISOString();
  await rest("corporate_mailboxes?active=eq.true", {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ sync_status: "ready", last_synced_at: now, updated_at: now }),
  });
  log("info", "imap.synced", { mailboxCount: mailboxes.length });
}
while (!stopping) {
  try {
    await sync();
  } catch (error) {
    log("error", "imap.sync_failed", {
      errorCode: String(error?.code || error?.message || "IMAP_SYNC_FAILED").slice(0, 80),
    });
  }
  await new Promise((resolve) => setTimeout(resolve, interval));
}
