import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { TripMemberRole } from "@/lib/types";

const INVITABLE_ROLES: TripMemberRole[] = ["traveler", "viewer", "advisor", "finance", "client"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InvitationResponseStatus =
  "accepted" | "already_member" | "declined" | "expired" | "revoked" | "forbidden" | "invalid";

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function invitationToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const createTripInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { tripId: string; email: string; role: TripMemberRole }) => input)
  .handler(async ({ data, context }) => {
    const email = data.email.trim().toLowerCase();
    if (
      !/^[0-9a-f-]{36}$/i.test(data.tripId) ||
      !EMAIL_PATTERN.test(email) ||
      !INVITABLE_ROLES.includes(data.role)
    )
      throw new Error("INVALID_INPUT");
    const db = await adminClient();
    const { data: trip, error: tripError } = await db
      .from("trips")
      .select("trip_uuid")
      .eq("trip_uuid", data.tripId)
      .eq("workspace_user_id", context.userId)
      .maybeSingle();
    if (tripError || !trip) throw tripError ?? new Error("TRIP_NOT_FOUND");

    const token = invitationToken();
    const { data: invitation, error } = await db
      .from("trip_invitations")
      .insert({
        trip_uuid: data.tripId,
        email,
        role: data.role,
        token_hash: await sha256(token),
        invited_by: context.userId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id, expires_at")
      .single();
    if (error) throw error;
    return { id: invitation.id as string, token, expiresAt: invitation.expires_at as string };
  });

export const getTripInvitation = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    if (!/^[0-9a-f]{64}$/i.test(data.token)) return { status: "invalid" as const };
    const db = await adminClient();
    const { data: invitation, error } = await db
      .from("trip_invitations")
      .select(
        "id, trip_uuid, role, expires_at, accepted_at, declined_at, revoked_at, trips(name, workspace_user_id)",
      )
      .eq("token_hash", await sha256(data.token))
      .maybeSingle();
    if (error || !invitation) return { status: "invalid" as const };
    const status = invitation.revoked_at
      ? "revoked"
      : invitation.accepted_at
        ? "accepted"
        : invitation.declined_at
          ? "declined"
          : Date.parse(invitation.expires_at) <= Date.now()
            ? "expired"
            : "pending";
    const trip = Array.isArray(invitation.trips) ? invitation.trips[0] : invitation.trips;
    return {
      status,
      invitationId: invitation.id as string,
      tripId: invitation.trip_uuid as string,
      tripName: String(trip?.name ?? "Reis"),
      role: invitation.role as TripMemberRole,
      expiresAt: invitation.expires_at as string,
    };
  });

export const respondToTripInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { response: "accept" | "decline"; token?: string; invitationId?: string }) => input,
  )
  .handler(async ({ data, context }) => {
    const db = await adminClient();
    let tokenHash =
      data.token && /^[0-9a-f]{64}$/i.test(data.token) ? await sha256(data.token) : "";
    let invitationId = "";
    if (tokenHash) {
      const { data: invitation, error } = await db
        .from("trip_invitations")
        .select("id")
        .eq("token_hash", tokenHash)
        .maybeSingle();
      if (error || !invitation) throw error ?? new Error("INVITATION_NOT_FOUND");
      invitationId = invitation.id;
    }
    if (!tokenHash && data.invitationId && /^[0-9a-f-]{36}$/i.test(data.invitationId)) {
      const { data: invitation, error } = await db
        .from("trip_invitations")
        .select("token_hash")
        .eq("id", data.invitationId)
        .maybeSingle();
      if (error || !invitation) throw error ?? new Error("INVITATION_NOT_FOUND");
      tokenHash = invitation.token_hash;
      invitationId = data.invitationId;
    }
    if (!tokenHash) throw new Error("INVALID_INVITATION");
    const functionName =
      data.response === "accept" ? "accept_trip_invitation" : "decline_trip_invitation";
    const { data: result, error } = await db.rpc(functionName, {
      p_token_hash: tokenHash,
      p_user_id: context.userId,
    });
    if (error) {
      const reference =
        error.code === "PGRST202"
          ? "rpc-unavailable"
          : error.code === "23505"
            ? "membership-conflict"
            : "database-error";
      console.error("[Trip invitation] Response failed.", {
        reference,
        code: error.code,
        response: data.response,
      });
      throw new Error(`INVITATION_RESPONSE_FAILED:${reference}`);
    }
    if (!result || typeof result !== "object" || typeof result.status !== "string") {
      console.error("[Trip invitation] RPC returned an invalid response shape.");
      throw new Error("INVITATION_RESPONSE_FAILED:invalid-response");
    }
    if (["accepted", "already_member", "declined"].includes(result.status) && invitationId) {
      const { error: notificationError } = await db
        .from("notifications")
        .update({ dismissed_at: new Date().toISOString() })
        .eq("user_id", context.userId)
        .eq("event_key", `invitation:${invitationId}`)
        .is("dismissed_at", null);
      if (notificationError) {
        console.error("[Trip invitation] Notification could not be dismissed.", {
          code: notificationError.code,
        });
      }
    }
    return result as { status: InvitationResponseStatus; tripId?: string };
  });

export const removeTripMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { tripId: string; memberId: string }) => input)
  .handler(async ({ data, context }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.tripId) || !data.memberId.trim()) {
      throw new Error("INVALID_INPUT");
    }
    const db = await adminClient();
    const { data: removed, error } = await db.rpc("remove_trip_member", {
      p_trip_uuid: data.tripId,
      p_member_id: data.memberId,
      p_owner_id: context.userId,
    });
    if (error) {
      console.error("[Trip member] Removal failed.", { code: error.code });
      throw new Error(
        error.code === "PGRST202" ? "MEMBER_REMOVAL_UNAVAILABLE" : "MEMBER_REMOVAL_FAILED",
      );
    }
    if (!removed) throw new Error("MEMBER_NOT_FOUND");
    return { removed: true };
  });
