import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Globe, Mail, Save } from "lucide-react";
import { toast } from "sonner";
import {
  getAgencyDeliverySettings,
  saveAgencyDeliverySettings,
  verifyAgencyDomain,
  type AgencyDeliverySettings as Values,
} from "@/lib/agency-delivery.functions";
import { useLocale } from "@/lib/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
export function AgencyDeliverySettings() {
  const { text } = useLocale(),
    q = useQuery({
      queryKey: ["agency-delivery"],
      queryFn: () => getAgencyDeliverySettings(),
      retry: false,
    }),
    [form, setForm] = useState<Values | null>(null),
    [busy, setBusy] = useState(false),
    [verifying, setVerifying] = useState(false);
  useEffect(() => {
    if (q.data) setForm(q.data);
  }, [q.data]);
  if (!form) return null;
  const set = (key: keyof Values, value: string) =>
    setForm((v) => (v ? { ...v, [key]: value } : v));
  async function save() {
    if (!form) return;
    setBusy(true);
    try {
      await saveAgencyDeliverySettings({
        data: {
          subdomain: form.subdomain,
          customDomain: form.customDomain,
          fromName: form.fromName,
          fromEmail: form.fromEmail,
          replyTo: form.replyTo,
        },
      });
      await q.refetch();
      toast.success(
        text("Domein- en afzenderinstellingen opgeslagen.", "Domain and sender settings saved."),
      );
    } catch (e) {
      toast.error(
        e instanceof Error && e.message === "DOMAIN_ALREADY_USED"
          ? text("Dit domein is al gekoppeld.", "This domain is already linked.")
          : text("Instellingen konden niet worden opgeslagen.", "Settings could not be saved."),
      );
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    if (!form) return;
    setVerifying(true);
    try {
      const result = await verifyAgencyDomain();
      await q.refetch();
      result.verified
        ? toast.success(
            text(
              "Domein geverifieerd. HTTPS wordt automatisch geactiveerd.",
              "Domain verified. HTTPS will be enabled automatically.",
            ),
          )
        : toast.error(
            text(
              `DNS is nog niet compleet. CNAME: ${result.cnameOk ? "ok" : "mist"}, TXT: ${result.txtOk ? "ok" : "mist"}.`,
              `DNS is incomplete. CNAME: ${result.cnameOk ? "ok" : "missing"}, TXT: ${result.txtOk ? "ok" : "missing"}.`,
            ),
          );
    } finally {
      setVerifying(false);
    }
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2">
            <Globe className="size-5" />
            {text("Agency-domein", "Agency domain")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label={text("Subdomein", "Subdomain")}
            value={form.subdomain}
            suffix=".globetrotr.nl"
            onChange={(v) => set("subdomain", v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          />
          <Field
            label={text("Eigen domein (optioneel)", "Custom domain (optional)")}
            value={form.customDomain}
            onChange={(v) => set("customDomain", v.toLowerCase())}
          />
          <p className="text-xs text-muted-foreground">
            {text(
              "Na self-hosting verifieert GlobeTrotr een TXT-record en activeert daarna automatisch TLS. Status:",
              "After self-hosting, GlobeTrotr verifies a TXT record and then automatically enables TLS. Status:",
            )}{" "}
            {form.domainStatus}
          </p>
          {form.verificationToken && (
            <div className="space-y-2 rounded-lg bg-muted p-3 text-xs">
              <p>
                CNAME <strong>{form.customDomain || text("jouw domein", "your domain")}</strong> →{" "}
                <strong>globetrotr.nl</strong>
              </p>
              <p>
                TXT <strong>_globetrotr.{form.customDomain}</strong>
              </p>
              <code className="block break-all">
                globetrotr-verification={form.verificationToken}
              </code>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={verifying || !form.customDomain}
            onClick={() => void verify()}
          >
            {verifying
              ? text("DNS controleren...", "Checking DNS...")
              : text("DNS controleren en activeren", "Verify DNS and activate")}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2">
            <Mail className="size-5" />
            {text("E-mailafzender", "Email sender")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label={text("Afzendernaam", "Sender name")}
            value={form.fromName}
            onChange={(v) => set("fromName", v)}
          />
          <Field
            label={text("Afzenderadres", "From address")}
            type="email"
            value={form.fromEmail}
            onChange={(v) => set("fromEmail", v)}
          />
          <Field
            label="Reply-to"
            type="email"
            value={form.replyTo}
            onChange={(v) => set("replyTo", v)}
          />
          <p className="text-xs text-muted-foreground">
            {text(
              "SMTP-inloggegevens worden later uitsluitend in de versleutelde VPS secret store gekoppeld en nooit hier getoond.",
              "SMTP credentials will later only be linked in the encrypted VPS secret store and never shown here.",
            )}
          </p>
        </CardContent>
      </Card>
      <Button
        className="lg:col-span-2 lg:justify-self-start"
        disabled={busy}
        onClick={() => void save()}
      >
        <Save className="size-4" />
        {busy
          ? text("Opslaan…", "Saving…")
          : text("Domeininstellingen opslaan", "Save domain settings")}
      </Button>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  suffix?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span>{label}</span>
      <div className="flex">
        <Input
          className={suffix ? "rounded-r-none" : ""}
          type={type}
          value={value}
          maxLength={254}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && (
          <span className="flex items-center rounded-r-md border border-l-0 bg-muted px-3 text-xs">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
