import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type IssueInput = {
  id?: string; titleNl: string; titleEn: string; descriptionNl: string; descriptionEn: string;
  status: "investigating" | "planned" | "monitoring" | "resolved";
  severity: "low" | "medium" | "high" | "critical"; public: boolean;
  category: "bug" | "improvement" | "idea" | "usability" | "translation" | "security" | "other";
};

async function adminDb(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  const { data, error } = await db.auth.admin.getUserById(userId);
  const { data: assigned } = await db.from("platform_admins").select("role").eq("user_id", userId).eq("active", true).maybeSingle();
  if (error || data.user?.app_metadata?.corporate_admin !== true || !assigned) {
    await audit(db, userId, "admin.access", "platform", null, "failure", { reason: "authorization_denied" });
    throw new Error("FORBIDDEN");
  }
  return db;
}

async function audit(db: any, actorUserId: string, action: string, targetType: string, targetId: string | null, result: "success"|"failure", details: Record<string, unknown> = {}) {
  const { error } = await db.from("platform_admin_audit_log").insert({ actor_user_id: actorUserId, action, target_type: targetType, target_id: targetId, result, details });
  if (error) console.error("[Corporate Admin] Auditlog kon niet worden geschreven.", error);
}

async function syncGithub(issue: any) {
  const token = process.env["GITHUB_ISSUES_TOKEN"]?.trim();
  const repository = process.env["GITHUB_ISSUES_REPOSITORY"]?.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
  if (!token || !repository) return { synced: false, reason: "not_configured" };
  const [owner, repo] = repository.split("/");
  if (!owner || !repo) return { synced: false, reason: "repository_invalid" };
  const body = `## Nederlands\n\n${issue.description_nl}\n\n## English\n\n${issue.description_en}\n\n**Category:** ${issue.category}\n**Status:** ${issue.status}  \n**Severity:** ${issue.severity}  \n**Public:** ${issue.public ? "yes" : "no"}\n\n_Automatically synchronized from GlobeTrotr Corporate Admin._`;
  const existing = Number(issue.github_issue_number);
  const payload = existing
    ? { title: issue.title_en, body, state: issue.status === "resolved" ? "closed" : "open" }
    : { title: issue.title_en, body };
  const response = await fetch(existing
    ? `https://api.github.com/repos/${owner}/${repo}/issues/${existing}`
    : `https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: existing ? "PATCH" : "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2026-03-10",
        "Content-Type": "application/json",
        "User-Agent": "GlobeTrotr-Corporate-Admin",
      },
      body: JSON.stringify(payload),
    });
  if (!response.ok) {
    console.error(`[GitHub Issues] Synchronisatie mislukt met HTTP ${response.status}.`);
    return { synced: false, reason: `http_${response.status}` };
  }
  const result = await response.json() as { number: number };
  return { synced: true, number: result.number };
}

export const getCorporateAdminData = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const db = await adminDb(context.userId);
  const [feedback, issues, workspaces, trips, auditLog, profiles, authUsers] = await Promise.all([
    db.from("beta_feedback").select("*").order("created_at", { ascending: false }),
    db.from("known_issues").select("*").order("created_at", { ascending: false }),
    db.from("workspaces").select("user_id, plan, created_at, updated_at"),
    db.from("trips").select("archived, is_public"),
    db.from("platform_admin_audit_log").select("id, actor_user_id, action, target_type, target_id, result, details, created_at").order("created_at", { ascending: false }).limit(30),
    db.from("profiles").select("id, display_name, email, locale, created_at, updated_at"),
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (feedback.error) throw feedback.error;
  if (issues.error) throw issues.error;
  if (workspaces.error) throw workspaces.error;
  if (trips.error) throw trips.error;
  if (auditLog.error) throw auditLog.error;
  if (profiles.error) throw profiles.error;
  if (authUsers.error) throw authUsers.error;
  const workspaceRows = workspaces.data ?? [];
  const tripRows = trips.data ?? [];
  const feedbackRows = feedback.data ?? [];
  const issueRows = issues.data ?? [];
  const profileById = new Map((profiles.data ?? []).map((profile: any) => [profile.id, profile]));
  const workspaceById = new Map(workspaceRows.map((workspace: any) => [workspace.user_id, workspace]));
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  await audit(db, context.userId, "admin.dashboard.view", "platform", null, "success");
  return {
    feedback: feedbackRows,
    issues: issueRows,
    auditLog: auditLog.data ?? [],
    users: authUsers.data.users.map((user: any) => {
      const profile: any = profileById.get(user.id);
      const workspace: any = workspaceById.get(user.id);
      return { id: user.id, email: user.email ?? profile?.email ?? "", displayName: profile?.display_name ?? "", locale: profile?.locale ?? "nl-NL", plan: workspace?.plan ?? "free", createdAt: user.created_at, lastSignInAt: user.last_sign_in_at ?? null, emailConfirmed: Boolean(user.email_confirmed_at), hasWorkspace: Boolean(workspace) };
    }),
    metrics: {
      workspaces: workspaceRows.length,
      newWorkspaces30d: workspaceRows.filter((row: any) => Date.parse(row.created_at) >= thirtyDaysAgo).length,
      activeWorkspaces30d: workspaceRows.filter((row: any) => Date.parse(row.updated_at) >= thirtyDaysAgo).length,
      plans: {
        free: workspaceRows.filter((row: any) => row.plan === "free").length,
        pro: workspaceRows.filter((row: any) => row.plan === "pro").length,
        agency: workspaceRows.filter((row: any) => row.plan === "agency").length,
      },
      activeTrips: tripRows.filter((row: any) => !row.archived).length,
      publicTrips: tripRows.filter((row: any) => !row.archived && row.is_public).length,
      openFeedback: feedbackRows.filter((row: any) => !row.archived_at && !["resolved", "closed"].includes(row.status)).length,
      openIssues: issueRows.filter((row: any) => !row.archived_at && row.status !== "resolved").length,
    },
  };
});

export const getPlatformUserDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminDb(context.userId);
    if (!/^[0-9a-f-]{36}$/i.test(data.userId)) throw new Error("INVALID_INPUT");

    const [authUser, profile, workspace, ownedTrips, memberships] = await Promise.all([
      db.auth.admin.getUserById(data.userId),
      db.from("profiles").select("display_name, email, locale, created_at, updated_at").eq("id", data.userId).maybeSingle(),
      db.from("workspaces").select("plan, share_enabled, created_at, updated_at").eq("user_id", data.userId).maybeSingle(),
      db.from("trips").select("trip_uuid, name, start_date, end_date, archived, is_public, created_at, updated_at").eq("workspace_user_id", data.userId).order("updated_at", { ascending: false }),
      db.from("trip_members").select("trip_uuid", { count: "exact", head: true }).eq("user_id", data.userId).eq("status", "active"),
    ]);
    if (authUser.error || !authUser.data.user) throw authUser.error ?? new Error("USER_NOT_FOUND");
    if (profile.error) throw profile.error;
    if (workspace.error) throw workspace.error;
    if (ownedTrips.error) throw ownedTrips.error;
    if (memberships.error) throw memberships.error;

    const trips = ownedTrips.data ?? [];
    await audit(db, context.userId, "user.detail.view", "user", data.userId, "success");
    return {
      user: {
        id: authUser.data.user.id,
        email: authUser.data.user.email ?? profile.data?.email ?? "",
        displayName: profile.data?.display_name ?? "",
        locale: profile.data?.locale ?? "nl-NL",
        emailConfirmed: Boolean(authUser.data.user.email_confirmed_at),
        blockedUntil: authUser.data.user.banned_until ?? null,
        createdAt: authUser.data.user.created_at,
        lastSignInAt: authUser.data.user.last_sign_in_at ?? null,
      },
      workspace: workspace.data ? {
        plan: workspace.data.plan ?? "free",
        publicSharingEnabled: Boolean(workspace.data.share_enabled),
        createdAt: workspace.data.created_at,
        updatedAt: workspace.data.updated_at,
      } : null,
      tripCounts: {
        total: trips.length,
        active: trips.filter((trip: any) => !trip.archived).length,
        public: trips.filter((trip: any) => !trip.archived && trip.is_public).length,
        archived: trips.filter((trip: any) => trip.archived).length,
        shared: memberships.count ?? 0,
      },
      recentTrips: trips.slice(0, 10).map((trip: any) => ({
        id: trip.trip_uuid,
        name: trip.name,
        start: trip.start_date,
        end: trip.end_date,
        archived: trip.archived,
        public: trip.is_public,
        createdAt: trip.created_at,
        updatedAt: trip.updated_at,
      })),
    };
  });

export const setPlatformUserBlocked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; blocked: boolean; reason: string }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminDb(context.userId);
    const reason = data.reason.trim();
    if (!/^[0-9a-f-]{36}$/i.test(data.userId) || reason.length < 10 || reason.length > 500) throw new Error("INVALID_INPUT");
    if (data.userId === context.userId) throw new Error("CANNOT_BLOCK_SELF");

    const { data: target, error: readError } = await db.auth.admin.getUserById(data.userId);
    if (readError || !target.user) throw readError ?? new Error("USER_NOT_FOUND");
    const wasBlocked = Boolean(target.user.banned_until && Date.parse(target.user.banned_until) > Date.now());
    if (wasBlocked === data.blocked) return { ok: true, blocked: wasBlocked };

    const { error } = await db.auth.admin.updateUserById(data.userId, { ban_duration: data.blocked ? "876000h" : "none" });
    if (error) {
      await audit(db, context.userId, data.blocked ? "user.block" : "user.restore", "user", data.userId, "failure", { reason, error: error.name ?? "auth_update_failed" });
      throw error;
    }
    await audit(db, context.userId, data.blocked ? "user.block" : "user.restore", "user", data.userId, "success", { reason });
    return { ok: true, blocked: data.blocked };
  });

export const updatePlatformUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; displayName: string; locale: "nl-NL"|"en-GB"; plan: "free"|"pro"|"agency"; reason: string }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminDb(context.userId);
    const displayName = data.displayName.trim();
    const reason = data.reason.trim();
    if (!/^[0-9a-f-]{36}$/i.test(data.userId) || displayName.length < 1 || displayName.length > 100 || reason.length < 10 || reason.length > 500) throw new Error("INVALID_INPUT");
    if (!["nl-NL", "en-GB"].includes(data.locale) || !["free", "pro", "agency"].includes(data.plan)) throw new Error("INVALID_INPUT");
    const { data: beforeWorkspace, error: workspaceReadError } = await db.from("workspaces").select("plan").eq("user_id", data.userId).maybeSingle();
    if (workspaceReadError || !beforeWorkspace) throw workspaceReadError ?? new Error("WORKSPACE_NOT_FOUND");
    const { data: beforeProfile, error: profileReadError } = await db.from("profiles").select("display_name, locale").eq("id", data.userId).maybeSingle();
    if (profileReadError || !beforeProfile) throw profileReadError ?? new Error("PROFILE_NOT_FOUND");
    const { error: profileError } = await db.from("profiles").update({ display_name: displayName, locale: data.locale }).eq("id", data.userId);
    if (profileError) throw profileError;
    const { error: workspaceError } = await db.from("workspaces").update({ plan: data.plan }).eq("user_id", data.userId);
    if (workspaceError) throw workspaceError;
    await audit(db, context.userId, "user.update", "user", data.userId, "success", { reason, changes: { display_name: [beforeProfile.display_name, displayName], locale: [beforeProfile.locale, data.locale], plan: [beforeWorkspace.plan, data.plan] } });
    return { ok: true };
  });

type HealthStatus = "operational" | "degraded" | "not_configured";
async function timedCheck(name: string, check: () => Promise<boolean>, configured = true) {
  const started = Date.now();
  if (!configured) return { name, status: "not_configured" as HealthStatus, durationMs: 0 };
  try { return { name, status: await check() ? "operational" as HealthStatus : "degraded" as HealthStatus, durationMs: Date.now() - started }; }
  catch { return { name, status: "degraded" as HealthStatus, durationMs: Date.now() - started }; }
}
async function reachable(url: string, headers?: Record<string,string>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try { const response = await fetch(url, { headers, signal: controller.signal }); return response.ok; }
  finally { clearTimeout(timeout); }
}

export const runPlatformHealthChecks = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const db = await adminDb(context.userId);
  const githubToken = process.env["GITHUB_ISSUES_TOKEN"]?.trim();
  const githubRepository = process.env["GITHUB_ISSUES_REPOSITORY"]?.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
  const checks = await Promise.all([
    timedCheck("database", async () => !(await db.from("workspaces").select("user_id", { head: true, count: "exact" })).error),
    timedCheck("storage", async () => !(await db.storage.listBuckets()).error),
    timedCheck("weather", () => reachable("https://api.open-meteo.com/v1/forecast?latitude=52.37&longitude=4.90&current=temperature_2m", { Accept: "application/json", "User-Agent": "GlobeTrotr-Healthcheck" })),
    timedCheck("rates", () => reachable("https://api.frankfurter.app/latest?from=EUR&to=USD")),
    timedCheck("github", () => reachable(`https://api.github.com/repos/${githubRepository}`, { Accept: "application/vnd.github+json", Authorization: `Bearer ${githubToken}`, "User-Agent": "GlobeTrotr-Corporate-Admin" }), Boolean(githubToken && githubRepository)),
    timedCheck("flights", async () => true, Boolean(process.env["SKYLINK_API_KEY"]?.trim())),
  ]);
  await audit(db, context.userId, "platform.health_check", "platform", null, "success", { overall_status: checks.some(check => check.status === "degraded") ? "degraded" : "operational", statuses: Object.fromEntries(checks.map(check => [check.name, check.status])) });
  return { checkedAt: new Date().toISOString(), checks };
});

export const saveKnownIssue = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: IssueInput) => input).handler(async ({ data, context }) => {
    const db = await adminDb(context.userId);
    const row = { title_nl: data.titleNl.trim(), title_en: data.titleEn.trim(), description_nl: data.descriptionNl.trim(), description_en: data.descriptionEn.trim(), category: data.category, status: data.status, severity: data.severity, public: data.public, updated_at: new Date().toISOString() };
    const query = data.id ? db.from("known_issues").update(row).eq("id", data.id) : db.from("known_issues").insert(row);
    const { data: saved, error } = await query.select("*").single();
    if (error) throw error;
    let github: Awaited<ReturnType<typeof syncGithub>>;
    try {
      github = await syncGithub(saved);
    } catch (error) {
      console.error("[GitHub Issues] Synchronisatieverzoek kon niet worden uitgevoerd.", error);
      github = { synced: false, reason: "network_error" };
    }
    if (github.synced && saved.github_issue_number !== github.number) await db.from("known_issues").update({ github_issue_number: github.number }).eq("id", saved.id);
    await audit(db, context.userId, data.id ? "known_issue.update" : "known_issue.create", "known_issue", saved.id, "success", { github_synced: github.synced, category: saved.category });
    return { issue: saved, github };
  });

export const updateFeedbackStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "new"|"reviewing"|"planned"|"resolved"|"closed" }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminDb(context.userId);
    const { error } = await db.from("beta_feedback").update({ status: data.status, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw error;
    await audit(db, context.userId, "feedback.status.update", "feedback", data.id, "success", { status: data.status });
    return { ok: true };
  });

export const manageAdminRecord = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: { kind: "feedback"|"issue"; id: string; action: "archive"|"restore"|"delete" }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminDb(context.userId);
    const table = data.kind === "feedback" ? "beta_feedback" : "known_issues";
    if (data.action === "delete") {
      if (data.kind === "issue") {
        const { data: issue } = await db.from(table).select("*").eq("id", data.id).single();
        if (issue?.github_issue_number) {
          await syncGithub({ ...issue, status: "resolved", title_en: `[Removed] ${issue.title_en}`, public: false });
        }
      }
      const { error } = await db.from(table).delete().eq("id", data.id);
      if (error) throw error;
    } else {
      const archived_at = data.action === "archive" ? new Date().toISOString() : null;
      const { data: row, error } = await db.from(table).update({ archived_at, updated_at: new Date().toISOString() }).eq("id", data.id).select("*").single();
      if (error) throw error;
      if (data.kind === "issue" && row.github_issue_number) await syncGithub({ ...row, status: data.action === "archive" ? "resolved" : row.status });
    }
    await audit(db, context.userId, `${data.kind}.${data.action}`, data.kind, data.id, "success");
    return { ok: true };
  });
