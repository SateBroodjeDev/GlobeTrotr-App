import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export type AgencyDeliverySettings = {
  workspaceId: string;
  subdomain: string;
  customDomain: string;
  domainStatus: "unconfigured" | "pending" | "verified" | "failed";
  verificationToken: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  mailStatus: "unconfigured" | "pending" | "verified" | "failed";
  smtpConfigured: boolean;
};
const hostnamePattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}
async function workspace(client: any, user: string) {
  const { data } = await client
    .from("workspaces")
    .select("workspace_uuid,plan")
    .eq("user_id", user)
    .maybeSingle();
  if (data?.plan !== "agency") throw new Error("AGENCY_OWNER_REQUIRED");
  return data.workspace_uuid as string;
}
export const getAgencyDeliverySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = await db(),
      id = await workspace(client, context.userId);
    const [{ data: d }, { data: m }, { data: s }] = await Promise.all([
      client
        .from("agency_domains")
        .select("subdomain,custom_domain,verification_status,verification_token")
        .eq("workspace_uuid", id)
        .maybeSingle(),
      client
        .from("agency_mail_settings")
        .select("from_name,from_email,reply_to,verification_status,smtp_secret_ref")
        .eq("workspace_uuid", id)
        .maybeSingle(),
      client
        .from("agency_settings")
        .select("system_name,contact_email")
        .eq("workspace_uuid", id)
        .maybeSingle(),
    ]);
    return {
      workspaceId: id,
      subdomain: d?.subdomain ?? "",
      customDomain: d?.custom_domain ?? "",
      domainStatus: d?.verification_status ?? "unconfigured",
      verificationToken: d?.verification_token ?? "",
      fromName: m?.from_name ?? s?.system_name ?? "",
      fromEmail: m?.from_email ?? s?.contact_email ?? "",
      replyTo: m?.reply_to ?? s?.contact_email ?? "",
      mailStatus: m?.verification_status ?? "unconfigured",
      smtpConfigured: Boolean(m?.smtp_secret_ref),
    } as AgencyDeliverySettings;
  });
export const getAgencyHostWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((hostname: string) => hostname.trim().toLowerCase().replace(/\.$/, ""))
  .handler(async ({ data: hostname }) => {
    if (!hostnamePattern.test(hostname)) throw new Error("INVALID_AGENCY_HOST");
    if (["globetrotr.nl", "www.globetrotr.nl", "portal.globetrotr.nl", "dashboard.globetrotr.nl"].includes(hostname)) return null;
    const client = await db();
    const subdomain = hostname.endsWith(".globetrotr.nl") ? hostname.slice(0, -".globetrotr.nl".length) : "";
    const filter = subdomain ? `subdomain.eq.${subdomain},custom_domain.eq.${hostname}` : `custom_domain.eq.${hostname}`;
    const { data, error } = await client.from("agency_domains").select("workspace_uuid")
      .eq("verification_status", "verified").or(filter).limit(1).maybeSingle();
    if (error) throw new Error("AGENCY_DOMAIN_LOOKUP_FAILED");
    return { workspaceId: data?.workspace_uuid ? String(data.workspace_uuid) : null };
  });
export const saveAgencyDeliverySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (x: {
      subdomain: string;
      customDomain: string;
      fromName: string;
      fromEmail: string;
      replyTo: string;
    }) => x,
  )
  .handler(async ({ data, context }) => {
    const client = await db(),
      id = await workspace(client, context.userId);
    const { data: r, error } = await client.rpc("save_agency_delivery_settings", {
      p_actor: context.userId,
      p_workspace: id,
      p_domain: { subdomain: data.subdomain, customDomain: data.customDomain },
      p_mail: { fromName: data.fromName, fromEmail: data.fromEmail, replyTo: data.replyTo },
    });
    if (error)
      throw new Error(error.code === "23505" ? "DOMAIN_ALREADY_USED" : "DELIVERY_SETTINGS_FAILED");
    return r;
  });
export const verifyAgencyDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = await db(),
      id = await workspace(client, context.userId);
    const { data: domain } = await client
      .from("agency_domains")
      .select("custom_domain,verification_token")
      .eq("workspace_uuid", id)
      .single();
    if (!domain?.custom_domain) throw new Error("CUSTOM_DOMAIN_REQUIRED");
    const { resolve4, resolveCname, resolveTxt } = await import("node:dns/promises");
    let cname: string[] = [],
      txt: string[][] = [];
    const [cnameResult, txtResult, domainIpResult, platformIpResult] = await Promise.allSettled([
      resolveCname(domain.custom_domain),
      resolveTxt(`_globetrotr.${domain.custom_domain}`),
      resolve4(domain.custom_domain),
      resolve4("portal.globetrotr.nl"),
    ]);
    if (cnameResult.status === "fulfilled") cname = cnameResult.value;
    if (txtResult.status === "fulfilled") txt = txtResult.value;
    const cnameOk = cname.some((value) =>
      ["globetrotr.nl", "dashboard.globetrotr.nl", "portal.globetrotr.nl"].includes(value.replace(/\.$/, "").toLowerCase()),
    ) || (domainIpResult.status === "fulfilled" && platformIpResult.status === "fulfilled" &&
      domainIpResult.value.some((ip) => platformIpResult.value.includes(ip)));
    const txtOk = txt.some(
      (parts) => parts.join("") === `globetrotr-verification=${domain.verification_token}`,
    );
    const verified = cnameOk && txtOk;
    const { error: updateError } = await client
      .from("agency_domains")
      .update({
        verification_status: verified ? "verified" : "failed",
        verified_at: verified ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_uuid", id);
    if (updateError) throw new Error("DOMAIN_VERIFICATION_SAVE_FAILED");
    return { verified, cnameOk, txtOk };
  });
