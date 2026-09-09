import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AGENCY_PERMISSIONS, type AgencyPermission, type AgencyPermissionMap, type AgencyPermissionOverrides } from "@/lib/agency-permissions";

export type AgencyRole = "owner" | "advisor" | "finance";
export type AgencyTeamMember = { userId: string; name: string; email: string; role: AgencyRole; status: "active" | "suspended"; joinedAt: string | null };
export type AgencyInvitation = { id: string; email: string; role: Exclude<AgencyRole, "owner">; createdAt: string; expiresAt: string; status: "pending" | "expired" };
export type AgencySettings = { workspaceId: string; systemName: string; senderName: string; contactEmail: string; defaultLocale: "nl" | "en"; timezone: string; currency: string; domain: string; tagline: string; accent: number; logoPath: string | null };
export type AgencyPermissionSettings = { roles: Record<"advisor"|"finance",AgencyPermissionMap>; members: {userId:string;role:"advisor"|"finance";overrides:AgencyPermissionOverrides}[] };
export type MyAgencyAccess = { workspaceId: string; role: AgencyRole; permissions: AgencyPermissionMap };
export type TripBrandingSettings = { enabled: boolean; brandName: string; domain: string; tagline: string; accent: number | null };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f-]{36}$/i;

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function token() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function ownerWorkspace(db: any, userId: string) {
  const { data, error } = await db.from("workspaces").select("workspace_uuid, plan").eq("user_id", userId).maybeSingle();
  if (error || !data || data.plan !== "agency") throw new Error("AGENCY_OWNER_REQUIRED");
  return data.workspace_uuid as string;
}

export const getMyAgencyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient();
    const { data: owned } = await db.from("workspaces").select("workspace_uuid, plan").eq("user_id", context.userId).maybeSingle();
    if (owned?.plan === "agency" && owned.workspace_uuid) {
      return { workspaceId: owned.workspace_uuid, role: "owner", permissions: Object.fromEntries(AGENCY_PERMISSIONS.map((permission) => [permission, true])) } as MyAgencyAccess;
    }
    const { data: membership, error: membershipError } = await db.from("workspace_members")
      .select("workspace_uuid, role, permission_overrides, workspaces!inner(plan)")
      .eq("user_id", context.userId).eq("status", "active").in("role", ["advisor", "finance"]).maybeSingle();
    if (membershipError || !membership || (Array.isArray(membership.workspaces) ? membership.workspaces[0]?.plan : membership.workspaces?.plan) !== "agency") throw new Error("AGENCY_ACCESS_REQUIRED");
    const { data: defaults, error: defaultsError } = await db.from("agency_role_permissions").select("permissions")
      .eq("workspace_uuid", membership.workspace_uuid).eq("role", membership.role).maybeSingle();
    if (defaultsError) throw new Error("AGENCY_PERMISSIONS_UNAVAILABLE");
    const { effectiveAgencyPermissions } = await import("@/lib/agency-permissions");
    return {
      workspaceId: membership.workspace_uuid,
      role: membership.role,
      permissions: effectiveAgencyPermissions(membership.role, defaults?.permissions, membership.permission_overrides),
    } as MyAgencyAccess;
  });

export const getTripBranding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { tripId: string }) => input)
  .handler(async ({ data, context }) => {
    if (!UUID.test(data.tripId)) throw new Error("INVALID_TRIP");
    const db = await adminClient();
    const { data: result, error } = await db.rpc("get_trip_branding", { p_actor_id: context.userId, p_trip_uuid: data.tripId });
    if (error || !result) throw new Error("TRIP_BRANDING_UNAVAILABLE");
    return { enabled: Boolean(result.enabled), brandName: result.brandName ?? "", domain: result.domain ?? "", tagline: result.tagline ?? "", accent: typeof result.accent === "number" ? result.accent : null } as TripBrandingSettings;
  });

export const saveTripBranding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { tripId: string; branding: TripBrandingSettings }) => input)
  .handler(async ({ data, context }) => {
    const branding = { enabled: data.branding.enabled, brandName: clean(data.branding.brandName, 50), domain: clean(data.branding.domain, 120).toLowerCase(), tagline: clean(data.branding.tagline, 120), accent: data.branding.accent == null ? null : Math.round(data.branding.accent) };
    if (!UUID.test(data.tripId) || (branding.accent != null && (branding.accent < 0 || branding.accent > 360))) throw new Error("INVALID_TRIP_BRANDING");
    const db = await adminClient();
    const { data: saved, error } = await db.rpc("save_trip_branding", { p_actor_id: context.userId, p_trip_uuid: data.tripId, p_branding: branding });
    if (error || !saved) throw new Error("TRIP_BRANDING_SAVE_FAILED");
    return { ok: true };
  });

const clean = (value: string, max: number) => value.trim().slice(0, max);

export const getAgencySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient();
    const workspaceId = await ownerWorkspace(db, context.userId);
    const { data, error } = await db.rpc("get_agency_settings", { p_owner_id: context.userId });
    if (error || !data) throw new Error("AGENCY_SETTINGS_UNAVAILABLE");
    return { workspaceId, systemName: data.systemName, senderName: data.senderName, contactEmail: data.contactEmail, defaultLocale: data.defaultLocale, timezone: data.timezone, currency: data.currency, domain: data.domain, tagline: data.tagline, accent: data.accent, logoPath: data.logoPath } as AgencySettings;
  });

export const saveAgencySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Omit<AgencySettings, "workspaceId">) => input)
  .handler(async ({ data, context }) => {
    const values = {
      systemName: clean(data.systemName, 50), senderName: clean(data.senderName, 60),
      contactEmail: data.contactEmail.trim().toLowerCase(), defaultLocale: data.defaultLocale,
      timezone: clean(data.timezone, 50), currency: data.currency.trim().toUpperCase(),
      domain: clean(data.domain, 120).toLowerCase(), tagline: clean(data.tagline, 120),
      accent: Math.round(data.accent), logoPath: data.logoPath,
    };
    if (!values.systemName || !values.senderName || !EMAIL.test(values.contactEmail) || !["nl","en"].includes(values.defaultLocale) || !/^[A-Z]{3}$/.test(values.currency) || !values.timezone || values.accent < 0 || values.accent > 360) throw new Error("INVALID_AGENCY_SETTINGS");
    const db = await adminClient();
    const { data: result, error } = await db.rpc("save_agency_settings", { p_owner_id: context.userId, p_settings: values });
    if (error || !result?.ok) throw new Error("AGENCY_SETTINGS_SAVE_FAILED");
    return result as { ok: true; restored: string[] };
  });

function validPermissions(value: AgencyPermissionOverrides, complete = false) {
  const keys = Object.keys(value);
  return (!complete || keys.length === AGENCY_PERMISSIONS.length) && keys.every((key) => (AGENCY_PERMISSIONS as readonly string[]).includes(key) && typeof value[key as AgencyPermission] === "boolean");
}

export const getAgencyPermissions = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const db = await adminClient(); const { data, error } = await db.rpc("get_agency_permissions", { p_owner_id: context.userId });
  if (error || !data) throw new Error("AGENCY_PERMISSIONS_UNAVAILABLE");
  return { roles: data.roles, members: data.members ?? [] } as AgencyPermissionSettings;
});
export const saveAgencyRolePermissions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: { role: "advisor"|"finance"; permissions: AgencyPermissionMap }) => input).handler(async ({ data, context }) => {
  if (!["advisor","finance"].includes(data.role) || !validPermissions(data.permissions, true)) throw new Error("INVALID_PERMISSIONS");
  const db = await adminClient(); const { data: ok, error } = await db.rpc("save_agency_role_permissions", { p_owner_id: context.userId, p_role: data.role, p_permissions: data.permissions });
  if (error || !ok) throw new Error("PERMISSIONS_SAVE_FAILED"); return { ok: true };
});
export const saveAgencyMemberPermissions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: { userId: string; overrides: AgencyPermissionOverrides }) => input).handler(async ({ data, context }) => {
  if (!UUID.test(data.userId) || !validPermissions(data.overrides)) throw new Error("INVALID_PERMISSIONS");
  const db = await adminClient(); const { data: ok, error } = await db.rpc("save_agency_member_permissions", { p_owner_id: context.userId, p_member_user_id: data.userId, p_overrides: data.overrides });
  if (error || !ok) throw new Error("PERMISSIONS_SAVE_FAILED"); return { ok: true };
});

export const getAgencyTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient();
    const workspaceId = await ownerWorkspace(db, context.userId);
    const [{ data: members, error: memberError }, { data: invitations, error: invitationError }] = await Promise.all([
      db.from("workspace_members").select("user_id, role, status, joined_at").eq("workspace_uuid", workspaceId).order("role"),
      db.from("workspace_invitations").select("id, email, role, created_at, expires_at").eq("workspace_uuid", workspaceId).is("accepted_at", null).is("declined_at", null).is("revoked_at", null).order("created_at", { ascending: false }),
    ]);
    if (memberError || invitationError) throw memberError ?? invitationError;
    const detailed = await Promise.all((members ?? []).map(async (member: any) => {
      const [{ data: profile }, authResult] = await Promise.all([
        db.from("profiles").select("display_name").eq("id", member.user_id).maybeSingle(),
        db.auth.admin.getUserById(member.user_id),
      ]);
      const email = String(authResult.data?.user?.email ?? "");
      return { userId: member.user_id, name: profile?.display_name || email || "Team member", email, role: member.role, status: member.status, joinedAt: member.joined_at } as AgencyTeamMember;
    }));
    const now = Date.now();
    return { members: detailed, invitations: (invitations ?? []).map((item: any) => ({ id: item.id, email: item.email, role: item.role, createdAt: item.created_at, expiresAt: item.expires_at, status: Date.parse(item.expires_at) <= now ? "expired" : "pending" })) as AgencyInvitation[] };
  });

export const createAgencyInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; role: "advisor" | "finance" }) => input)
  .handler(async ({ data, context }) => {
    const email = data.email.trim().toLowerCase();
    if (!EMAIL.test(email) || !["advisor", "finance"].includes(data.role)) throw new Error("INVALID_INPUT");
    const db = await adminClient();
    const workspaceId = await ownerWorkspace(db, context.userId);
    const rawToken = token();
    const { data: invitation, error } = await db.from("workspace_invitations").insert({ workspace_uuid: workspaceId, email, role: data.role, token_hash: await sha256(rawToken), invited_by: context.userId, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() }).select("id, expires_at").single();
    if (error) throw new Error(error.code === "23505" ? "INVITATION_EXISTS" : "INVITATION_CREATE_FAILED");
    return { id: invitation.id as string, token: rawToken, expiresAt: invitation.expires_at as string };
  });

export const manageAgencyInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { invitationId: string; action: "renew" | "revoke" }) => input)
  .handler(async ({ data, context }) => {
    if (!UUID.test(data.invitationId)) throw new Error("INVALID_INPUT");
    const rawToken = data.action === "renew" ? token() : "";
    const db = await adminClient();
    const { data: result, error } = await db.rpc("manage_workspace_invitation", { p_invitation_id: data.invitationId, p_owner_id: context.userId, p_action: data.action, p_token_hash: rawToken ? await sha256(rawToken) : null });
    if (error || !result || result.status !== (data.action === "renew" ? "renewed" : "revoked")) throw new Error("AGENCY_INVITATION_MANAGEMENT_FAILED");
    return { ...result, token: rawToken || undefined } as { status: "renewed" | "revoked"; token?: string; expiresAt?: string };
  });

export const manageAgencyMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; action: "role" | "suspend" | "restore" | "remove"; role?: "advisor" | "finance" }) => input)
  .handler(async ({ data, context }) => {
    if (!UUID.test(data.userId) || (data.action === "role" && !data.role)) throw new Error("INVALID_INPUT");
    const db = await adminClient();
    const { data: result, error } = await db.rpc("manage_workspace_member", { p_member_user_id: data.userId, p_owner_id: context.userId, p_action: data.action, p_role: data.role ?? null });
    if (error || !result?.ok) throw new Error("AGENCY_MEMBER_MANAGEMENT_FAILED");
    return result as { ok: true };
  });

export const getAgencyInvitation = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    if (!/^[0-9a-f]{64}$/i.test(data.token)) return { status: "invalid" as const };
    const db = await adminClient();
    const { data: row } = await db.from("workspace_invitations").select("id, role, expires_at, accepted_at, declined_at, revoked_at, workspaces(data)").eq("token_hash", await sha256(data.token)).maybeSingle();
    if (!row) return { status: "invalid" as const };
    const workspace = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
    const status = row.revoked_at ? "revoked" : row.accepted_at ? "accepted" : row.declined_at ? "declined" : Date.parse(row.expires_at) <= Date.now() ? "expired" : "pending";
    return { status, invitationId: row.id as string, role: row.role as "advisor" | "finance", expiresAt: row.expires_at as string, workspaceName: String(workspace?.data?.branding?.brandName ?? "GlobeTrotr Agency") };
  });

export const respondToAgencyInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { response: "accept" | "decline"; token?: string; invitationId?: string }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminClient();
    let tokenHash = data.token && /^[0-9a-f]{64}$/i.test(data.token) ? await sha256(data.token) : "";
    if (!tokenHash && data.invitationId && UUID.test(data.invitationId)) {
      const { data: invitation } = await db.from("workspace_invitations").select("token_hash").eq("id", data.invitationId).maybeSingle();
      tokenHash = invitation?.token_hash ?? "";
    }
    if (!tokenHash) throw new Error("INVALID_INVITATION");
    const { data: result, error } = await db.rpc("respond_workspace_invitation", { p_token_hash: tokenHash, p_user_id: context.userId, p_response: data.response });
    if (error || !result) throw new Error("AGENCY_INVITATION_RESPONSE_FAILED");
    return result as { status: "accepted" | "declined" | "expired" | "revoked" | "forbidden"; workspaceId?: string };
  });
