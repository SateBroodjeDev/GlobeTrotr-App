import { createDecipheriv } from "node:crypto";

const using = ["urn:ietf:params:jmap:core", "urn:stalwart:jmap"];

export function accountLocalPart(address) {
  const match = String(address || "").toLowerCase().match(/^([a-z0-9][a-z0-9._-]*)@globetrotr\.nl$/);
  if (!match) throw Object.assign(new Error("MAIL_ADDRESS_INVALID"), { code: "MAIL_ADDRESS_INVALID" });
  return match[1];
}

export function accountProperties(mailbox, domainId, password) {
  return {
    "@type": "User",
    name: accountLocalPart(mailbox.address),
    domainId,
    credentials: mailbox.active ? { "0": { "@type": "Password", secret: password } } : {},
    memberGroupIds: {},
    roles: { "@type": "User" },
    permissions: { "@type": "Inherit" },
    quotas: {},
    aliases: {},
    description: `${mailbox.display_name} · GlobeTrotr ${mailbox.mailbox_type}`.slice(0, 200),
    locale: "en-US",
    encryptionAtRest: { "@type": "Disabled" },
  };
}

export function decryptMailboxPassword(ciphertext, base64Key) {
  const key = Buffer.from(String(base64Key || ""), "base64");
  const [version, iv, tag, encrypted] = String(ciphertext || "").split(".");
  if (key.length !== 32 || version !== "v1" || !iv || !tag || !encrypted)
    throw Object.assign(new Error("MAILBOX_CREDENTIAL_INVALID"), { code: "MAILBOX_CREDENTIAL_INVALID" });
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

async function call(config, method, arguments_, callId) {
  const response = await fetch(`${config.url.replace(/\/$/, "")}/api`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ using, methodCalls: [[method, arguments_, callId]] }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw Object.assign(new Error("STALWART_HTTP_ERROR"), { code: `STALWART_HTTP_${response.status}` });
  const body = await response.json();
  const [name, result] = body.methodResponses?.[0] || [];
  if (name === "error" || !result) throw Object.assign(new Error("STALWART_API_ERROR"), { code: `STALWART_${String(result?.type || "INVALID_RESPONSE").replace(/[^A-Z0-9_]/gi,"_").toUpperCase()}` });
  return result;
}

export async function provisionMailbox(config, mailbox, password) {
  const localPart = accountLocalPart(mailbox.address);
  const query = await call(config, "x:Account/query", { filter: { name: localPart, domainId: config.domainId }, limit: 2 }, "query");
  if ((query.ids || []).length > 1) throw Object.assign(new Error("STALWART_DUPLICATE_ACCOUNT"), { code: "STALWART_DUPLICATE_ACCOUNT" });
  const properties = accountProperties(mailbox, config.domainId, password);
  const existingId = mailbox.mail_server_account_id || query.ids?.[0];
  const mutableProperties = { ...properties };
  delete mutableProperties.name;
  delete mutableProperties.domainId;
  delete mutableProperties["@type"];
  const change = existingId
    ? { update: { [existingId]: mutableProperties } }
    : { create: { mailbox: properties } };
  const result = await call(config, "x:Account/set", change, "set");
  const failure = existingId ? result.notUpdated?.[existingId] : result.notCreated?.mailbox;
  if (failure) throw Object.assign(new Error("STALWART_ACCOUNT_REJECTED"), { code: `STALWART_${String(failure.type || "REJECTED").replace(/[^A-Z0-9_]/gi,"_").toUpperCase()}` });
  const accountId = existingId || result.created?.mailbox?.id;
  if (!accountId) throw Object.assign(new Error("STALWART_ACCOUNT_ID_MISSING"), { code: "STALWART_ACCOUNT_ID_MISSING" });
  return accountId;
}

export async function checkStalwart(config) {
  const result=await call(config,"x:Account/query",{filter:{domainId:config.domainId},limit:1},"health");
  return Array.isArray(result.ids);
}
