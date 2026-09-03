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
  .inputValidator((input: { share_enabled: boolean; share_financials: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("workspaces")
      .update({
        share_enabled: data.share_enabled,
        share_financials: data.share_financials,
      })
      .eq("user_id", userId)
      .select("public_token, share_enabled, share_financials")
      .maybeSingle();
    if (error) throw error;
    return row;
  });
