import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createTranslationDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { text: string; source: "nl" | "en"; target: "nl" | "en" }) => input)
  .handler(async ({ data, context }) => {
    const value = data.text.trim();
    if (value.length < 2 || value.length > 5000 || data.source === data.target) throw new Error("INVALID_TRANSLATION_REQUEST");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const [{ data: user }, { data: admin }] = await Promise.all([
      db.auth.admin.getUserById(context.userId),
      db.from("platform_admins").select("role,permissions").eq("user_id", context.userId).eq("active", true).maybeSingle(),
    ]);
    if (user.user?.app_metadata?.corporate_admin !== true || !admin || (admin.role !== "owner" && admin.permissions?.issues !== true && admin.permissions?.operations !== true)) throw new Error("FORBIDDEN");
    const endpoint = process.env["TRANSLATION_API_URL"]?.trim();
    if (!endpoint) throw new Error("TRANSLATION_NOT_CONFIGURED");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const apiKey = process.env["TRANSLATION_API_KEY"]?.trim();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
        body: JSON.stringify({ q: value, source: data.source, target: data.target, format: "text", api_key: apiKey || undefined }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("TRANSLATION_PROVIDER_FAILED");
      const result = await response.json() as { translatedText?: string; translation?: string };
      const translated = (result.translatedText ?? result.translation ?? "").trim();
      if (!translated || translated.length > 7000) throw new Error("TRANSLATION_PROVIDER_INVALID");
      return { translated };
    } finally { clearTimeout(timer); }
  });
