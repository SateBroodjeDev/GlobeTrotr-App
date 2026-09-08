import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type IssueInput = {
  id?: string; titleNl: string; titleEn: string; descriptionNl: string; descriptionEn: string;
  status: "investigating" | "planned" | "monitoring" | "resolved";
  severity: "low" | "medium" | "high" | "critical"; public: boolean;
};

async function adminDb(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || data.user?.app_metadata?.corporate_admin !== true) throw new Error("FORBIDDEN");
  return db;
}

async function syncGithub(issue: any) {
  const token = process.env["GITHUB_ISSUES_TOKEN"];
  const repository = process.env["GITHUB_ISSUES_REPOSITORY"];
  if (!token || !repository) return { synced: false, reason: "not_configured" };
  const [owner, repo] = repository.split("/");
  if (!owner || !repo) throw new Error("GITHUB_ISSUES_REPOSITORY_INVALID");
  const body = `## Nederlands\n\n${issue.description_nl}\n\n## English\n\n${issue.description_en}\n\n**Status:** ${issue.status}  \n**Severity:** ${issue.severity}  \n**Public:** ${issue.public ? "yes" : "no"}\n\n_Automatically synchronized from GlobeTrotr Corporate Admin._`;
  const existing = Number(issue.github_issue_number);
  const response = await fetch(existing
    ? `https://api.github.com/repos/${owner}/${repo}/issues/${existing}`
    : `https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: existing ? "PATCH" : "POST",
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2026-03-10", "Content-Type": "application/json" },
      body: JSON.stringify({ title: issue.title_en, body, labels: ["known-issue", issue.severity], state: issue.status === "resolved" ? "closed" : "open" }),
    });
  if (!response.ok) throw new Error(`GITHUB_SYNC_FAILED_${response.status}`);
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
    const row = { title_nl: data.titleNl.trim(), title_en: data.titleEn.trim(), description_nl: data.descriptionNl.trim(), description_en: data.descriptionEn.trim(), status: data.status, severity: data.severity, public: data.public, updated_at: new Date().toISOString() };
    const query = data.id ? db.from("known_issues").update(row).eq("id", data.id) : db.from("known_issues").insert(row);
    const { data: saved, error } = await query.select("*").single();
    if (error) throw error;
    const github = await syncGithub(saved);
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
