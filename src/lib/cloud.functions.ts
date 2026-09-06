import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const loadWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("workspaces")
      .select("data, public_token, share_enabled, share_financials")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  });

export const saveWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { data: unknown }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("workspaces")
      .upsert(
        { user_id: userId, data: data.data as never },
        { onConflict: "user_id" },
      );
    if (error) throw error;
    return { ok: true };
  });

export const updateSharing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { share_enabled: boolean; share_financials: boolean; pin?: string | null }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.pin !== undefined && data.pin !== null && !/^\d{6,12}$/.test(data.pin)) {
      throw new Error("Kies een PIN van 6 tot 12 cijfers.");
    }
    const share_pin_hash =
      data.pin === undefined ? undefined : data.pin === null ? null : await hashPin(data.pin);
    const { data: row, error } = await supabase
      .from("workspaces")
      .update({
        share_enabled: data.share_enabled,
        share_financials: data.share_financials,
        ...(share_pin_hash === undefined ? {} : { share_pin_hash }),
      })
      .eq("user_id", userId)
      .select("public_token, share_enabled, share_financials, share_pin_hash")
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Workspace niet gevonden.");
    return {
      public_token: row.public_token,
      share_enabled: row.share_enabled,
      share_financials: row.share_financials,
      has_pin: Boolean(row.share_pin_hash),
    };
  });

export const getSharing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("workspaces")
      .select("public_token, share_enabled, share_financials, share_pin_hash")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      public_token: data.public_token,
      share_enabled: data.share_enabled,
      share_financials: data.share_financials,
      has_pin: Boolean(data.share_pin_hash),
    };
  });

async function hashPin(pin: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
