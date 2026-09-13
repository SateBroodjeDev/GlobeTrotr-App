import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function db() { const { supabaseAdmin } = await import("@/integrations/supabase/client.server"); return supabaseAdmin as any; }
async function contactAdmin(userId: string) {
  const client = await db();
  const [userResult, adminResult] = await Promise.all([client.auth.admin.getUserById(userId), client.from("platform_admins").select("role,permissions").eq("user_id", userId).eq("active", true).maybeSingle()]);
  const user = userResult.data?.user, admin = adminResult.data;
  if (userResult.error || adminResult.error || user?.app_metadata?.corporate_admin !== true || !admin || (admin.role !== "owner" && admin.permissions?.mail !== true)) throw new Error("FORBIDDEN");
  return client;
}
async function audit(client: any, userId: string, action: string, id: string, details: Record<string, unknown> = {}) {
  const { error } = await client.from("platform_admin_audit_log").insert({ actor_user_id: userId, action, target_type: "contact_message", target_id: id, result: "success", details });
  if (error) throw new Error("AUDIT_FAILED");
}

export const submitContact = createServerFn({ method: "POST" }).validator((input: { name: string; email: string; subject: string; message: string; locale: string; website: string; captchaToken: string }) => input).handler(async ({ data }) => {
  if (data.website) throw new Error("SPAM");
  if (data.name.trim().length < 2 || data.name.trim().length > 100 || data.subject.trim().length < 3 || data.subject.trim().length > 160 || data.message.trim().length < 20 || data.message.trim().length > 3000 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) throw new Error("INVALID");
  const secret = process.env["TURNSTILE_SECRET_KEY"]?.trim();
  if (secret) { const body = new URLSearchParams({ secret, response: data.captchaToken }); const check = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body }); const result = await check.json() as { success: boolean }; if (!result.success) throw new Error("CAPTCHA"); }
  else if (process.env["NODE_ENV"] === "production") throw new Error("CAPTCHA_UNAVAILABLE");
  const client = await db(); const { error } = await client.from("contact_messages").insert({ name: data.name.trim(), email: data.email.trim().toLowerCase(), subject: data.subject.trim(), message: data.message.trim(), locale: data.locale === "en" ? "en" : "nl" });
  if (error) throw new Error("SAVE_FAILED"); return { ok: true };
});

export const listContactMessages = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const client = await contactAdmin(context.userId); const { data, error } = await client.from("contact_messages").select("id,name,email,subject,message,locale,status,created_at,updated_at,handled_by").order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error("CONTACT_LIST_FAILED"); return data ?? [];
});

export const updateContactMessage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input: { id: string; status: "new" | "reviewing" | "answered" | "closed" }) => input).handler(async ({ data, context }) => {
  if (!/^[0-9a-f-]{36}$/i.test(data.id) || !["new", "reviewing", "answered", "closed"].includes(data.status)) throw new Error("INVALID");
  const client = await contactAdmin(context.userId); const { data: previous, error: readError } = await client.from("contact_messages").select("status").eq("id", data.id).single(); if (readError) throw new Error("CONTACT_NOT_FOUND");
  const { error } = await client.from("contact_messages").update({ status: data.status, handled_by: context.userId, updated_at: new Date().toISOString() }).eq("id", data.id); if (error) throw new Error("CONTACT_UPDATE_FAILED");
  await audit(client, context.userId, "contact.status.update", data.id, { from: previous.status, to: data.status }); return { ok: true };
});
