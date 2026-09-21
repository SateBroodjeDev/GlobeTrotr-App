import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createHmac } from "node:crypto";

type Plan = "pro" | "agency";

async function database() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function ownedWorkspace(db: any, userId: string) {
  const { data, error } = await db
    .from("workspaces")
    .select("workspace_uuid,user_id,plan")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) throw new Error("BILLING_OWNER_REQUIRED");
  return data;
}

export const createPaddleCheckoutBinding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { plan: Plan; mode: "one_time" | "recurring" }) => input)
  .handler(async ({ data, context }) => {
    if (!["pro", "agency"].includes(data.plan) || !["one_time", "recurring"].includes(data.mode))
      throw new Error("PADDLE_CHECKOUT_INVALID");
    const secret = process.env.PADDLE_CHECKOUT_BINDING_SECRET?.trim();
    if (!secret || secret.length < 32) throw new Error("PADDLE_BINDING_NOT_CONFIGURED");
    const db = await database();
    const workspace = await ownedWorkspace(db, context.userId);
    const encoded = Buffer.from(JSON.stringify({
      w: workspace.workspace_uuid,
      p: data.plan,
      m: data.mode,
      t: Date.now(),
    })).toString("base64url");
    const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
    return { token: `${encoded}.${signature}` };
  });

export const getBillingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<any> => {
    const db = await database();
    const workspace = await ownedWorkspace(db, context.userId);
    const { data: customer } = await db
      .from("billing_customers")
      .select("id,provider_customer_id,billing_email")
      .eq("workspace_uuid", workspace.workspace_uuid)
      .maybeSingle();
    let subscription = null;
    let transactions: Array<Record<string, unknown>> = [];
    const entitlementResult = await db
      .from("billing_entitlements")
      .select("plan,ends_at")
      .eq("workspace_uuid", workspace.workspace_uuid)
      .gt("ends_at", new Date().toISOString())
      .order("ends_at", { ascending: false })
      .limit(100);
    if (entitlementResult.error) throw new Error("BILLING_ENTITLEMENTS_FAILED");
    const activeEntitlements = (entitlementResult.data ?? []).filter(
      (item: { plan: string }) => item.plan === workspace.plan,
    );
    if (customer) {
      const result = await db
        .from("billing_subscriptions")
        .select(
          "provider_subscription_id,plan,status,currency,recurring_total_minor,billing_interval,current_period_end,scheduled_change,cancelled_at,updated_at",
        )
        .eq("customer_id", customer.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      subscription = result.data;
      const transactionResult = await db
        .from("billing_transactions")
        .select("provider_transaction_id,status,currency,total_minor,refunded_minor,occurred_at")
        .eq("customer_id", customer.id)
        .order("occurred_at", { ascending: false })
        .limit(12);
      if (transactionResult.error) throw new Error("BILLING_TRANSACTIONS_FAILED");
      transactions = transactionResult.data ?? [];
    }
    return {
      workspaceId: workspace.workspace_uuid as string,
      plan: workspace.plan as "free" | Plan,
      customerId: customer?.provider_customer_id ?? null,
      subscription,
      oneTimeAccess: activeEntitlements.length
        ? { plan: workspace.plan, endsAt: activeEntitlements[0].ends_at, monthsPurchased: activeEntitlements.length }
        : null,
      transactions,
      checkout: {
        environment:
          process.env.VITE_PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox",
        clientToken: process.env.VITE_PADDLE_CLIENT_TOKEN ?? "",
        prices: {
          recurring: {
            pro: process.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID ?? "",
            agency: process.env.VITE_PADDLE_AGENCY_MONTHLY_PRICE_ID ?? "",
          },
          oneTime: {
            pro: process.env.VITE_PADDLE_PRO_ONETIME_PRICE_ID ?? "",
            agency: process.env.VITE_PADDLE_AGENCY_ONETIME_PRICE_ID ?? "",
          },
        },
        email: String(context.claims.email ?? ""),
      },
    };
  });

export const createPaddleInvoiceLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { transactionId: string }) => input)
  .handler(async ({ data, context }) => {
    if (!/^txn_[A-Za-z0-9]+$/.test(data.transactionId))
      throw new Error("PADDLE_TRANSACTION_INVALID");
    const apiKey = process.env.PADDLE_API_KEY?.trim();
    if (!apiKey) throw new Error("PADDLE_NOT_CONFIGURED");
    const db = await database();
    const workspace = await ownedWorkspace(db, context.userId);
    const { data: customer } = await db
      .from("billing_customers")
      .select("id")
      .eq("workspace_uuid", workspace.workspace_uuid)
      .maybeSingle();
    const { data: transaction } = customer
      ? await db
          .from("billing_transactions")
          .select("provider_transaction_id")
          .eq("customer_id", customer.id)
          .eq("provider_transaction_id", data.transactionId)
          .maybeSingle()
      : { data: null };
    if (!transaction) throw new Error("PADDLE_TRANSACTION_NOT_FOUND");
    const base =
      process.env.VITE_PADDLE_ENVIRONMENT === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com";
    const response = await fetch(
      `${base}/transactions/${encodeURIComponent(data.transactionId)}/invoice`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) throw new Error(`PADDLE_INVOICE_${response.status}`);
    const result = (await response.json()) as { data?: { url?: string } };
    const url = result.data?.url;
    if (!url || !url.startsWith("https://")) throw new Error("PADDLE_INVOICE_URL_MISSING");
    return { url };
  });

export const createPaddlePortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const apiKey = process.env.PADDLE_API_KEY?.trim();
    if (!apiKey) throw new Error("PADDLE_NOT_CONFIGURED");
    const db = await database();
    const workspace = await ownedWorkspace(db, context.userId);
    const { data: customer } = await db
      .from("billing_customers")
      .select("provider_customer_id")
      .eq("workspace_uuid", workspace.workspace_uuid)
      .maybeSingle();
    if (!customer?.provider_customer_id) throw new Error("PADDLE_CUSTOMER_MISSING");
    const base =
      process.env.VITE_PADDLE_ENVIRONMENT === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com";
    const response = await fetch(
      `${base}/customers/${encodeURIComponent(customer.provider_customer_id)}/portal-sessions`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) throw new Error(`PADDLE_PORTAL_${response.status}`);
    const result = (await response.json()) as {
      data?: { urls?: { general?: { overview?: string } } };
    };
    const url = result.data?.urls?.general?.overview;
    if (!url || !url.startsWith("https://")) throw new Error("PADDLE_PORTAL_URL_MISSING");
    return { url };
  });

export const changePaddlePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { plan: Plan }) => input)
  .handler(async ({ data, context }) => {
    if (!(["pro", "agency"] as string[]).includes(data.plan))
      throw new Error("PADDLE_PLAN_INVALID");
    const apiKey = process.env.PADDLE_API_KEY?.trim();
    const priceId =
      data.plan === "agency"
        ? process.env.VITE_PADDLE_AGENCY_MONTHLY_PRICE_ID?.trim()
        : process.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID?.trim();
    if (!apiKey || !priceId) throw new Error("PADDLE_NOT_CONFIGURED");
    const db = await database();
    const workspace = await ownedWorkspace(db, context.userId);
    const { data: customer } = await db
      .from("billing_customers")
      .select("id")
      .eq("workspace_uuid", workspace.workspace_uuid)
      .maybeSingle();
    const { data: subscription } = customer
      ? await db
          .from("billing_subscriptions")
          .select("provider_subscription_id,status")
          .eq("customer_id", customer.id)
          .in("status", ["active", "trialing", "past_due"])
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };
    if (!subscription?.provider_subscription_id) throw new Error("PADDLE_SUBSCRIPTION_MISSING");
    const base =
      process.env.VITE_PADDLE_ENVIRONMENT === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com";
    const currentResponse = await fetch(
      `${base}/subscriptions/${encodeURIComponent(subscription.provider_subscription_id)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!currentResponse.ok) throw new Error(`PADDLE_SUBSCRIPTION_${currentResponse.status}`);
    const currentSubscription = (await currentResponse.json()) as {
      data?: { items?: Array<{ price?: { id?: string }; quantity?: number }> };
    };
    const currentItems = currentSubscription.data?.items ?? [];
    if (
      currentItems.length === 1 &&
      currentItems[0]?.price?.id === priceId &&
      Number(currentItems[0]?.quantity ?? 1) === 1
    )
      return { ok: true, changed: false };
    const response = await fetch(
      `${base}/subscriptions/${encodeURIComponent(subscription.provider_subscription_id)}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ price_id: priceId, quantity: 1 }],
          proration_billing_mode: "prorated_immediately",
          on_payment_failure: "prevent_change",
          custom_data: { workspace_uuid: workspace.workspace_uuid, plan: data.plan },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok) throw new Error(`PADDLE_PLAN_CHANGE_${response.status}`);
    return { ok: true, changed: true };
  });
