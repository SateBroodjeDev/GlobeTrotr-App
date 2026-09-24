import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { createDecipheriv, createHash, randomUUID } from "node:crypto";
import { scanBuffer } from "./clamav.mjs";
import { safeImapErrorCode } from "./imap-diagnostics.mjs";
import { parseBookingMail } from "./booking-mail-parser.mjs";

const env = process.env,
  supabaseUrl = required("SUPABASE_URL").replace(/\/$/, ""),
  serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
const serviceAuthHeaders = {
  apikey: serviceKey,
  ...(serviceKey.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${serviceKey}` }),
};
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
    ...serviceAuthHeaders,
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
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
const normalized = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
function decrypt(value) {
  const raw = required("MAILBOX_CREDENTIALS_KEY");
  const key = Buffer.from(raw, "base64");
  const [version, iv, tag, encrypted] = String(value).split(".");
  if (key.length !== 32 || version !== "v1" || !iv || !tag || !encrypted)
    throw new Error("MAILBOX_CREDENTIAL_INVALID");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
async function updateSyncState(boxes, changes) {
  const ids = boxes.map((box) => box.id).filter(Boolean);
  if (!ids.length) return;
  await rest(`corporate_mailboxes?id=in.(${ids.join(",")})`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ ...changes, updated_at: new Date().toISOString() }),
  });
}
async function sync() {
  const mailboxes = await rest(
    "corporate_mailboxes?active=eq.true&select=id,address,display_name,owner_user_id,last_synced_at,imap_host,imap_port,imap_secure,imap_username,imap_password_ciphertext",
  );
  if (!mailboxes.length) return;
  const dedicated = mailboxes.filter((box) => box.imap_password_ciphertext);
  const fallback = mailboxes.filter((box) => !box.imap_password_ciphertext);
  const connections = dedicated.map((box) => ({
    boxes: [box],
    host: box.imap_host,
    port: box.imap_port,
    secure: box.imap_secure,
    user: box.imap_username,
    password: () => decrypt(box.imap_password_ciphertext),
  }));
  if (fallback.length)
    connections.push({
      boxes: fallback,
      host: env.IMAP_HOST,
      port: bounded(env.IMAP_PORT, 993, 1, 65535),
      secure: env.IMAP_SECURE !== "false",
      user: env.IMAP_USER,
      password: () => required("IMAP_PASSWORD"),
    });
  let succeeded = 0;
  let failed = 0;
  for (const connection of connections) {
    try {
    await updateSyncState(connection.boxes, {
      sync_status: "syncing", last_sync_attempt_at: new Date().toISOString(),
      last_sync_error_code: null,
    });
    const byAddress = new Map(connection.boxes.map((box) => [normalized(box.address), box]));
    const client = new ImapFlow({
      host: connection.host || required("IMAP_HOST"),
      port: connection.port,
      secure: connection.secure,
      auth: { user: connection.user || required("IMAP_USER"), pass: connection.password() },
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
            const bodyHtml = String(parsed.html || "").replace(/\0/g, "").slice(0, 100_000);
            const body = String(parsed.text || bodyHtml.replace(/<[^>]*>/g, " "))
              .replace(/\0/g, "")
              .slice(0, 100_000);
            const sender = normalized(parsed.from?.value?.[0]?.address) || "unknown@globetrotr.nl";
            const safeAttachments = [];
            let blockedAttachmentCount = 0;
            let attachmentBytes = 0;
            for (const attachment of (parsed.attachments || []).slice(0, 5)) {
              const content = Buffer.from(attachment.content || []);
              attachmentBytes += content.length;
              if (!content.length || content.length > 10 * 1024 * 1024 || attachmentBytes > 20 * 1024 * 1024)
                continue;
              try {
                await scanBuffer(content);
                safeAttachments.push({ attachment, content });
              } catch (error) {
                if (error?.code !== "MALWARE_DETECTED") throw error;
                blockedAttachmentCount += 1;
                log("error", "imap.attachment_rejected", {
                  errorCode: "MALWARE_DETECTED",
                });
              }
            }
            for (const box of targets) {
              try {
                const inserted = await rest("corporate_mail_messages", {
                  method: "POST",
                  headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
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
                    preview_text: `${blockedAttachmentCount ? `[${blockedAttachmentCount} bijlage(n) geblokkeerd / attachment(s) blocked] ` : ""}${body}`.slice(0, 1000),
                    body_text: body,
                    body_html: bodyHtml || null,
                    received_at: (parsed.date || message.internalDate || new Date()).toISOString(),
                  }),
                });
                if (inserted?.length) {
                  const bookingAddresses = await rest(`trip_booking_mail_addresses?mailbox_id=eq.${box.id}&active=eq.true&select=id,trip_uuid,allowed_senders,retention_days`);
                  const bookingAddress = bookingAddresses?.[0];
                  if (bookingAddress) {
                    const allowed = bookingAddress.allowed_senders || [];
                    const senderAllowed = !allowed.length || allowed.some((value) => normalized(value) === sender);
                    if (senderAllowed) {
                      const recognized = parseBookingMail({ sender, subject: parsed.subject, body });
                      const fingerprint = createHash("sha256").update(`${providerId}\n${sender}\n${String(parsed.subject || "")}`).digest("hex");
                      const bookingDraft = await rest("trip_booking_mail_drafts", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify({
                        address_id: bookingAddress.id, trip_uuid: bookingAddress.trip_uuid, message_id: inserted[0].id,
                        source_fingerprint: fingerprint, sender_address: sender, subject: String(parsed.subject || "").slice(0, 500),
                        booking_type: recognized.bookingType, parsed_data: recognized.parsedData, confidence: recognized.confidence,
                        source_expires_at: new Date(Date.now() + Number(bookingAddress.retention_days || 30) * 86_400_000).toISOString(),
                      }) });
                      if (bookingDraft?.length) {
                        const trips = await rest(`trips?trip_uuid=eq.${bookingAddress.trip_uuid}&select=id,workspace_user_id`);
                        if (trips?.[0]?.workspace_user_id) await rest("notifications", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({
                          user_id: trips[0].workspace_user_id, kind: "trip_booking", title: "Boekingsmail ontvangen / Booking email received",
                          body: `booking-mail|${recognized.bookingType}|${String(parsed.subject || "").slice(0,160)}`,
                          event_key: `trip-booking-mail:${bookingDraft[0].id}`, link: `/trips/${trips[0].id}`,
                        }) });
                      }
                    } else log("info", "booking_mail.sender_rejected", { mailboxId: box.id, senderDomain: sender.split("@")[1] || "unknown" });
                  }
                  for (const { attachment, content } of safeAttachments) {
                    const contentType = String(attachment.contentType || "application/octet-stream").slice(0, 150);
                    const fileName = String(attachment.filename || "attachment")
                      .replace(/[\0\r\n]/g, "")
                      .slice(0, 255);
                    const extension = fileName.includes(".")
                      ? `.${fileName.split(".").pop().replace(/[^a-z0-9]/gi, "").slice(0, 10)}`
                      : "";
                    const storageKey = `${box.id}/inbound/${randomUUID()}${extension}`;
                    const encodedPath = storageKey.split("/").map(encodeURIComponent).join("/");
                    const upload = await fetch(
                      `${supabaseUrl}/storage/v1/object/corporate-mail/${encodedPath}`,
                      {
                        method: "POST",
                        headers: {
                          ...serviceAuthHeaders,
                          "Content-Type": contentType,
                          "x-upsert": "false",
                        },
                        body: content,
                      },
                    );
                    if (!upload.ok) {
                      log("error", "imap.attachment_upload_failed", {
                        mailboxId: box.id,
                        status: upload.status,
                      });
                      continue;
                    }
                    try {
                      await rest("corporate_mail_attachments", {
                        method: "POST",
                        headers: { Prefer: "return=minimal" },
                        body: JSON.stringify({
                          message_id: inserted[0].id,
                          storage_key: storageKey,
                          file_name: fileName || "attachment",
                          content_type: contentType,
                          size_bytes: content.length,
                          sha256: createHash("sha256").update(content).digest("hex"),
                          content_id: String(attachment.contentId || "").replace(/^<|>$/g, "").slice(0, 255) || null,
                        }),
                      });
                    } catch (error) {
                      log("error", "imap.attachment_record_failed", {
                        mailboxId: box.id,
                        errorCode: String(error?.code || "ATTACHMENT_RECORD_FAILED").slice(0, 80),
                      });
                    }
                  }
                  const members = await rest(
                    `corporate_mailbox_members?mailbox_id=eq.${box.id}&select=user_id`,
                  );
                  const users = [
                    ...new Set(
                      [box.owner_user_id, ...(members ?? []).map((row) => row.user_id)].filter(
                        Boolean,
                      ),
                    ),
                  ];
                  if (users.length) {
                    await rest("notifications", {
                      method: "POST",
                      headers: { Prefer: "return=minimal" },
                      body: JSON.stringify(
                        users.map((userId) => ({
                          user_id: userId,
                          kind: "account",
                          title: "Nieuwe bedrijfsmail / New company email",
                          body: `mail|${box.display_name}|${String(parsed.subject || "").slice(0, 160)}`,
                          event_key: `corporate-mail:${inserted[0].id}`,
                          link: "/company-mail",
                        })),
                      ),
                    });
                  }
                }
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
    await updateSyncState(connection.boxes, {
      sync_status: "ready", last_synced_at: new Date().toISOString(),
      last_sync_error_code: null, sync_requested_at: null,
    });
    succeeded += connection.boxes.length;
    } catch (error) {
      failed += connection.boxes.length;
      const errorCode = safeImapErrorCode(error);
      await updateSyncState(connection.boxes, {
        sync_status: "error", last_sync_error_code: errorCode, sync_requested_at: null,
      });
      log("error", "imap.connection_failed", {
        mailboxIds: connection.boxes.map((box) => box.id), errorCode,
      });
    }
  }
  log(failed ? "error" : "info", "imap.synced", { succeeded, failed });
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
