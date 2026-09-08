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
  if (error || data.user?.app_metadata?.corporate_admin !== true) throw new Error("FORBIDDEN");
  return db;
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
  const [feedback, issues] = await Promise.all([
    db.from("beta_feedback").select("*").order("created_at", { ascending: false }),
    db.from("known_issues").select("*").order("created_at", { ascending: false }),
  ]);
  if (feedback.error) throw feedback.error;
  if (issues.error) throw issues.error;
  return { feedback: feedback.data ?? [], issues: issues.data ?? [] };
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
    return { issue: saved, github };
  });

export const updateFeedbackStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "new"|"reviewing"|"planned"|"resolved"|"closed" }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminDb(context.userId);
    const { error } = await db.from("beta_feedback").update({ status: data.status, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw error;
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
    return { ok: true };
  });
