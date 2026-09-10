import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AGENCY_PERMISSIONS, effectiveAgencyPermissions, type AgencyPermission, type AgencyPermissionMap, type AgencyPermissionOverrides } from "@/lib/agency-permissions";

export type AgencyRole = "owner" | "advisor" | "finance";
export type AgencyTeamMember = { userId: string; name: string; email: string; role: AgencyRole; status: "active" | "suspended"; joinedAt: string | null };
export type AgencyInvitation = { id: string; email: string; role: Exclude<AgencyRole, "owner">; createdAt: string; expiresAt: string; status: "pending" | "expired" };
export type AgencySettings = { workspaceId: string; systemName: string; senderName: string; contactEmail: string; defaultLocale: "nl" | "en"; timezone: string; currency: string; domain: string; tagline: string; accent: number; logoPath: string | null };
export type AgencyPermissionSettings = { roles: Record<"advisor"|"finance",AgencyPermissionMap>; members: {userId:string;role:"advisor"|"finance";overrides:AgencyPermissionOverrides}[] };
export type MyAgencyAccess = { workspaceId: string; role: AgencyRole; permissions: AgencyPermissionMap };
export type TripBrandingSettings = { enabled: boolean; brandName: string; domain: string; tagline: string; accent: number | null };
export type AgencyClient = {id:string;fullName:string;email:string;phone:string;locale:"nl"|"en";notes:string;status:"active"|"archived";tripIds:string[];createdAt:string;updatedAt:string};
export type AgencyOperationItem={id:string;tripId:string;tripName:string;title:string;date:string;detail:string};
export type AgencyOperations={upcoming:AgencyOperationItem[];missingBookings:AgencyOperationItem[];billableExpenses:AgencyOperationItem[];expiredInvitations:{id:string;email:string;expiresAt:string}[]};
export type AgencyAuditEntry={id:string;action:string;targetType:string;targetId:string;context:Record<string,unknown>;createdAt:string;actorId:string;actorName:string};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f-]{36}$/i;

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function agencyAudit(db:any,workspaceId:string,actorId:string,action:string,targetType?:string,targetId?:string,context:Record<string,unknown>={}){
  const {error}=await db.from("agency_audit_log").insert({workspace_uuid:workspaceId,actor_user_id:actorId,action,target_type:targetType??null,target_id:targetId??null,context});
  if(error)throw new Error("AGENCY_AUDIT_FAILED");
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

async function workspaceForPermission(db:any,userId:string,permission:AgencyPermission){
  const {data:owned}=await db.from("workspaces").select("workspace_uuid,user_id,plan").eq("user_id",userId).maybeSingle();
  if(owned?.plan==="agency")return {workspaceId:owned.workspace_uuid,ownerId:owned.user_id,role:"owner" as const};
  const {data:member}=await db.from("workspace_members").select("workspace_uuid,role,permission_overrides").eq("user_id",userId).eq("status","active").in("role",["advisor","finance"]).maybeSingle();
  if(!member)throw new Error("AGENCY_ACCESS_REQUIRED");
  const [{data:workspace},{data:defaults}]=await Promise.all([db.from("workspaces").select("user_id,plan").eq("workspace_uuid",member.workspace_uuid).maybeSingle(),db.from("agency_role_permissions").select("permissions").eq("workspace_uuid",member.workspace_uuid).eq("role",member.role).maybeSingle()]);
  if(workspace?.plan!=="agency"||!effectiveAgencyPermissions(member.role,defaults?.permissions,member.permission_overrides)[permission])throw new Error("AGENCY_PERMISSION_REQUIRED");
  return {workspaceId:member.workspace_uuid,ownerId:workspace.user_id,role:member.role as "advisor"|"finance"};
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
    const {data:trip}=await db.from("trips").select("workspace_uuid").eq("trip_uuid",data.tripId).single();
    if(!trip?.workspace_uuid)throw new Error("AGENCY_AUDIT_FAILED");await agencyAudit(db,trip.workspace_uuid,context.userId,"trip_branding.update","trip",data.tripId,{enabled:branding.enabled});
    return { ok: true };
  });

const clean = (value: string, max: number) => value.trim().slice(0, max);

export const getAgencyClients=createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  const db=await adminClient();const access=await workspaceForPermission(db,context.userId,"members_manage");
  const {data:clients,error}=await db.from("agency_clients").select("id,full_name,email,phone,locale,notes,status,created_at,updated_at,agency_client_trips(trip_uuid)").eq("workspace_uuid",access.workspaceId).order("full_name");
  if(error)throw error;return (clients??[]).map((client:any)=>({id:client.id,fullName:client.full_name,email:client.email??"",phone:client.phone??"",locale:client.locale,notes:client.notes??"",status:client.status,tripIds:(client.agency_client_trips??[]).map((link:any)=>link.trip_uuid),createdAt:client.created_at,updatedAt:client.updated_at})) as AgencyClient[];
});
export const saveAgencyClient=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:{id?:string;fullName:string;email:string;phone:string;locale:"nl"|"en";notes:string;tripIds:string[]})=>input).handler(async({data,context})=>{
  const db=await adminClient();const access=await workspaceForPermission(db,context.userId,"members_manage");const fullName=clean(data.fullName,100),email=clean(data.email,254).toLowerCase(),phone=clean(data.phone,40),notes=clean(data.notes,2000);
  if(!fullName||(email&&!EMAIL.test(email))||!['nl','en'].includes(data.locale)||data.tripIds.some(id=>!UUID.test(id)))throw new Error("INVALID_CLIENT");
  if(data.id&&!UUID.test(data.id))throw new Error("INVALID_CLIENT");
  const {data:clientId,error}=await db.rpc("save_agency_client",{p_actor_id:context.userId,p_workspace_uuid:access.workspaceId,p_client_id:data.id??null,p_client:{fullName,email,phone,locale:data.locale,notes},p_trip_ids:[...new Set(data.tripIds)]});
  if(error||!clientId)throw new Error("CLIENT_SAVE_FAILED");await agencyAudit(db,access.workspaceId,context.userId,data.id?"client.update":"client.create","client",clientId as string,{tripCount:new Set(data.tripIds).size});return {ok:true,id:clientId as string};
});
export const setAgencyClientArchived=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:{id:string;archived:boolean})=>input).handler(async({data,context})=>{if(!UUID.test(data.id))throw new Error("INVALID_CLIENT");const db=await adminClient();const access=await workspaceForPermission(db,context.userId,"members_manage");const {data:ok,error}=await db.rpc("set_agency_client_archived",{p_actor_id:context.userId,p_workspace_uuid:access.workspaceId,p_client_id:data.id,p_archived:data.archived});if(error||!ok)throw new Error("CLIENT_STATUS_FAILED");await agencyAudit(db,access.workspaceId,context.userId,data.archived?"client.archive":"client.restore","client",data.id);return {ok:true}});

export const getAgencyAudit=createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  const db=await adminClient();const workspaceId=await ownerWorkspace(db,context.userId);const {data,error}=await db.from("agency_audit_log").select("id,actor_user_id,action,target_type,target_id,context,created_at").eq("workspace_uuid",workspaceId).order("created_at",{ascending:false}).limit(100);if(error)throw new Error("AGENCY_AUDIT_UNAVAILABLE");
  const actorIds=[...new Set((data??[]).map((row:any)=>row.actor_user_id).filter(Boolean))] as string[];const {data:profiles}=actorIds.length?await db.from("profiles").select("id,display_name").in("id",actorIds):{data:[]};const names=new Map((profiles??[]).map((profile:any)=>[profile.id,profile.display_name]));
  return (data??[]).map((row:any)=>({id:row.id,action:row.action,targetType:row.target_type??"",targetId:row.target_id??"",context:row.context??{},createdAt:row.created_at,actorId:row.actor_user_id??"",actorName:names.get(row.actor_user_id)||""})) as AgencyAuditEntry[];
});

export const getAgencyOperations=createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  const db=await adminClient();const access=await workspaceForPermission(db,context.userId,"analytics_view");const today=new Date().toISOString().slice(0,10);
  const [{data:trips,error:tripError},{data:expired,error:inviteError}]=await Promise.all([
    db.from("trips").select("trip_uuid,name,start_date,end_date,archived,trip_travel_items(id,item_type,title,start_date,provider,booking_reference),trip_expenses(id,title,expense_date,amount,currency,billable)").eq("workspace_uuid",access.workspaceId).order("start_date"),
    db.from("workspace_invitations").select("id,email,expires_at").eq("workspace_uuid",access.workspaceId).is("accepted_at",null).is("declined_at",null).is("revoked_at",null).lt("expires_at",new Date().toISOString()).order("expires_at"),
  ]);if(tripError||inviteError)throw new Error("AGENCY_OPERATIONS_UNAVAILABLE");
  const upcoming:AgencyOperationItem[]=[],missingBookings:AgencyOperationItem[]=[],billableExpenses:AgencyOperationItem[]=[];
  for(const trip of trips??[]){const tripId=String(trip.trip_uuid),tripName=String(trip.name);if(!trip.archived&&trip.end_date>=today)upcoming.push({id:tripId,tripId,tripName,title:tripName,date:trip.start_date??"",detail:trip.end_date??""});
    for(const item of trip.trip_travel_items??[]){if(item.start_date>=today&&item.item_type!=="activity"&&(!item.provider||!item.booking_reference))missingBookings.push({id:String(item.id),tripId,tripName,title:String(item.title),date:item.start_date??"",detail:[!item.provider?"provider":"",!item.booking_reference?"reference":""].filter(Boolean).join(",")});}
    for(const expense of trip.trip_expenses??[]){if(expense.billable)billableExpenses.push({id:String(expense.id),tripId,tripName,title:String(expense.title),date:expense.expense_date??"",detail:`${expense.currency} ${expense.amount}`});}
  }
  return {upcoming:upcoming.slice(0,30),missingBookings:missingBookings.slice(0,30),billableExpenses:billableExpenses.slice(0,30),expiredInvitations:(expired??[]).slice(0,30).map((item:any)=>({id:item.id,email:item.email,expiresAt:item.expires_at}))} as AgencyOperations;
});

export const getAgencySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient();
    const access = await workspaceForPermission(db, context.userId,"branding_manage");
    const workspaceId = access.workspaceId;
    const { data, error } = await db.rpc("get_agency_settings", { p_owner_id: access.ownerId });
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
    const access=await workspaceForPermission(db,context.userId,"branding_manage");
    const { data: result, error } = await db.rpc("save_agency_settings", { p_owner_id: access.ownerId, p_settings: values });
    if (error || !result?.ok) throw new Error("AGENCY_SETTINGS_SAVE_FAILED");
    await agencyAudit(db,access.workspaceId,context.userId,"settings.update","workspace",access.workspaceId,{restored:result.restored??[]});
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
  if (error || !ok) throw new Error("PERMISSIONS_SAVE_FAILED"); const workspaceId=await ownerWorkspace(db,context.userId);await agencyAudit(db,workspaceId,context.userId,"permissions.role.update","role",data.role);return { ok: true };
});
export const saveAgencyMemberPermissions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: { userId: string; overrides: AgencyPermissionOverrides }) => input).handler(async ({ data, context }) => {
  if (!UUID.test(data.userId) || !validPermissions(data.overrides)) throw new Error("INVALID_PERMISSIONS");
  const db = await adminClient(); const { data: ok, error } = await db.rpc("save_agency_member_permissions", { p_owner_id: context.userId, p_member_user_id: data.userId, p_overrides: data.overrides });
  if (error || !ok) throw new Error("PERMISSIONS_SAVE_FAILED"); const workspaceId=await ownerWorkspace(db,context.userId);await agencyAudit(db,workspaceId,context.userId,"permissions.member.update","member",data.userId,{overrides:Object.keys(data.overrides)});return { ok: true };
});

export const getAgencyTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient();
    const workspaceId = (await workspaceForPermission(db,context.userId,"members_manage")).workspaceId;
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
    const workspaceId = (await workspaceForPermission(db,context.userId,"members_manage")).workspaceId;
    const rawToken = token();
    const { data: invitation, error } = await db.from("workspace_invitations").insert({ workspace_uuid: workspaceId, email, role: data.role, token_hash: await sha256(rawToken), invited_by: context.userId, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() }).select("id, expires_at").single();
    if (error) throw new Error(error.code === "23505" ? "INVITATION_EXISTS" : "INVITATION_CREATE_FAILED");
    await agencyAudit(db,workspaceId,context.userId,"invitation.create","invitation",invitation.id,{role:data.role});
    return { id: invitation.id as string, token: rawToken, expiresAt: invitation.expires_at as string };
  });

export const manageAgencyInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { invitationId: string; action: "renew" | "revoke" }) => input)
  .handler(async ({ data, context }) => {
    if (!UUID.test(data.invitationId)) throw new Error("INVALID_INPUT");
    const rawToken = data.action === "renew" ? token() : "";
    const db = await adminClient();
    const access=await workspaceForPermission(db,context.userId,"members_manage");
    const { data: result, error } = await db.rpc("manage_workspace_invitation", { p_invitation_id: data.invitationId, p_owner_id: access.ownerId, p_action: data.action, p_token_hash: rawToken ? await sha256(rawToken) : null });
    if (error || !result || result.status !== (data.action === "renew" ? "renewed" : "revoked")) throw new Error("AGENCY_INVITATION_MANAGEMENT_FAILED");
    await agencyAudit(db,access.workspaceId,context.userId,`invitation.${data.action}`,"invitation",data.invitationId);
    return { ...result, token: rawToken || undefined } as { status: "renewed" | "revoked"; token?: string; expiresAt?: string };
  });

export const manageAgencyMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; action: "role" | "suspend" | "restore" | "remove"; role?: "advisor" | "finance" }) => input)
  .handler(async ({ data, context }) => {
    if (!UUID.test(data.userId) || (data.action === "role" && !data.role)) throw new Error("INVALID_INPUT");
    const db = await adminClient();
    const access=await workspaceForPermission(db,context.userId,"members_manage");
    const { data: result, error } = await db.rpc("manage_workspace_member", { p_member_user_id: data.userId, p_owner_id: access.ownerId, p_action: data.action, p_role: data.role ?? null });
    if (error || !result?.ok) throw new Error("AGENCY_MEMBER_MANAGEMENT_FAILED");
    await agencyAudit(db,access.workspaceId,context.userId,`member.${data.action}`,"member",data.userId,data.role?{role:data.role}:{});
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
    const {data:invitation}=await db.from("workspace_invitations").select("id,workspace_uuid").eq("token_hash",tokenHash).maybeSingle();
    const { data: result, error } = await db.rpc("respond_workspace_invitation", { p_token_hash: tokenHash, p_user_id: context.userId, p_response: data.response });
    if (error || !result) throw new Error("AGENCY_INVITATION_RESPONSE_FAILED");
    if(["accepted","declined"].includes(result.status)&&invitation?.workspace_uuid)await agencyAudit(db,invitation.workspace_uuid,context.userId,`invitation.${data.response}`,"invitation",invitation.id);
    return result as { status: "accepted" | "declined" | "expired" | "revoked" | "forbidden"; workspaceId?: string };
  });
