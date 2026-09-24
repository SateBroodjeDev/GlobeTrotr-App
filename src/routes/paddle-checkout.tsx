import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { loadPaddle } from "@/lib/paddle-client";

export const Route = createFileRoute("/paddle-checkout")({
  head: () => ({ meta: [{ title: "Beveiligd afrekenen — GlobeTrotr" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: PaddleCheckoutBridge,
});

function PaddleCheckoutBridge() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (window.location.hostname !== "globetrotr.nl") {
      window.location.replace(`https://globetrotr.nl/paddle-checkout${window.location.hash}`);
      return;
    }
    void (async () => {
      try {
        const values = new URLSearchParams(window.location.hash.slice(1));
        const plan = values.get("plan");
        const mode = values.get("mode");
        const binding = values.get("binding");
        const locale = values.get("locale") === "nl" ? "nl" : "en";
        const priceId = values.get("price") ?? "";
        const token = values.get("clientToken") ?? "";
        const environment = values.get("environment") === "sandbox" ? "sandbox" : "production";
        if (!binding || binding.length > 4096 || !["pro", "agency"].includes(plan ?? "") || !["recurring", "oneTime"].includes(mode ?? "") || !/^pri_[A-Za-z0-9_]+$/.test(priceId) || token.length < 8 || token.length > 500) throw new Error("INVALID_CHECKOUT");
        const paddle = await loadPaddle(token, environment);
        paddle.Checkout.open({ items: [{ priceId, quantity: 1 }], customData: { checkout_binding: binding }, settings: { displayMode: "overlay", theme: "light", locale, successUrl: "https://portal.globetrotr.nl/billing?checkout=success" } });
      } catch { setFailed(true); }
    })();
  }, []);
  return <main className="grid min-h-screen place-items-center p-6"><div className="max-w-md text-center">{failed ? <><h1 className="font-display text-xl font-semibold">Checkout kon niet worden geopend</h1><p className="mt-2 text-sm text-muted-foreground">Ga terug naar je abonnement en probeer het opnieuw.</p><a href="https://portal.globetrotr.nl/billing" className="mt-4 inline-block text-primary underline">Terug naar abonnement</a></> : <><Loader2 className="mx-auto size-7 animate-spin text-primary"/><p className="mt-3 text-sm text-muted-foreground">Beveiligde checkout openen…</p></>}</div></main>;
}
