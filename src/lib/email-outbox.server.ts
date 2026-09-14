type AdminDb = { from: (table: string) => any };

export async function queueInvitationEmail(db: AdminDb, input: { recipient: string; locale?: string; title: string; body: string; actionUrl: string; preferenceUserId?: string; invitationType: "trip" | "agency"; invitationId: string }): Promise<boolean> {
  if (input.preferenceUserId) {
    const { data: profile } = await db.from("profiles").select("notification_preferences").eq("id", input.preferenceUserId).maybeSingle();
    if (profile?.notification_preferences?.invitations === false) return false;
  }
  const { data: config, error: configError } = await db.from("email_delivery_config").select("mode").eq("id", true).single();
  if (configError) {
    console.error("[Invitation email] Delivery configuration unavailable.", { code: configError.code });
    return false;
  }
  const { error } = await db.from("email_outbox").insert({
    notification_id: null,
    user_id: input.preferenceUserId ?? null,
    recipient_email: input.recipient,
    locale: input.locale === "en" ? "en" : "nl",
    template_key: "invitation",
    payload: { title: input.title, body: input.body, actionUrl: input.actionUrl },
    invitation_type: input.invitationType,
    invitation_id: input.invitationId,
    status: config.mode === "live" ? "pending" : "held",
  });
  if (error) {
    console.error("[Invitation email] Could not queue message.", { code: error.code });
    return false;
  }
  return true;
}
