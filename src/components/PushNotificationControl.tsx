import { useState } from "react";
import { BellRing, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPushStatus, revokePushSubscription, savePushSubscription } from "@/lib/push.functions";
import { useLocale } from "@/lib/locale";

function decodeKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export function PushNotificationControl() {
  const { text } = useLocale();
  const [busy, setBusy] = useState(false);
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  async function toggle() {
    if (!supported) return;
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const current = await registration.pushManager.getSubscription();
      if (current) {
        await revokePushSubscription({ data: { endpoint: current.endpoint } });
        await current.unsubscribe();
        toast.success(text("Pushmeldingen zijn op dit apparaat uitgezet.", "Push notifications are disabled on this device."));
        return;
      }
      const status = await getPushStatus();
      if (!status.publicKey) throw new Error("PUSH_NOT_CONFIGURED");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("PUSH_PERMISSION_DENIED");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(status.publicKey) });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("PUSH_SUBSCRIPTION_INVALID");
      await savePushSubscription({ data: { endpoint: json.endpoint, expirationTime: json.expirationTime ?? null, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }, userAgent: navigator.userAgent } });
      toast.success(text("Pushmeldingen zijn op dit apparaat aangezet.", "Push notifications are enabled on this device."));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message.includes("PERMISSION") ? text("Je browser heeft pushmeldingen geweigerd. Pas de toestemming aan in de browserinstellingen.", "Your browser denied push notifications. Change the permission in browser settings.") : message.includes("NOT_CONFIGURED") ? text("Pushmeldingen zijn nog niet op de server geconfigureerd.", "Push notifications have not been configured on the server yet.") : text("Pushmeldingen konden niet worden gewijzigd.", "Push notifications could not be changed."));
    } finally { setBusy(false); }
  }

  if (!supported) return null;
  return <div className="border-b p-3"><Button className="w-full justify-start" size="sm" variant="outline" disabled={busy} onClick={toggle}>{busy ? <Loader2 className="size-4 animate-spin" /> : Notification.permission === "granted" ? <BellOff className="size-4" /> : <BellRing className="size-4" />}{Notification.permission === "granted" ? text("Push op dit apparaat wijzigen", "Change push on this device") : text("Push op dit apparaat aanzetten", "Enable push on this device")}</Button><p className="mt-2 text-xs text-muted-foreground">{text("De push bevat alleen een algemene melding; details staan na inloggen in GlobeTrotr.", "The push only contains a general notice; details remain behind your GlobeTrotr sign-in.")}</p></div>;
}
