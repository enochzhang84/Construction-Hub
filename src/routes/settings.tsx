import { createFileRoute, Link } from "@tanstack/react-router";
import { useT, useLocale } from "@/lib/i18n";
import { useCompany, type CompanyProfile } from "@/lib/company-store";
import { useTerms, DEFAULT_TERMS_EN, DEFAULT_TERMS_ZH } from "@/lib/terms-store";
import { toast } from "sonner";
import { BookOpen, ChevronRight, FileText, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Construction Hub" }] }),
  component: SettingsPage,
});

function Field({
  label,
  field,
  placeholder,
  type = "text",
}: {
  label: string;
  field: keyof CompanyProfile;
  placeholder?: string;
  type?: string;
}) {
  const value = useCompany((s) => s.profile[field]);
  const setProfile = useCompany((s) => s.setProfile);
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setProfile({ [field]: e.target.value } as Partial<CompanyProfile>)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}

function SettingsPage() {
  const t = useT();
  const profile = useCompany((s) => s.profile);


  const ROLES = [
    { name: t("set.role.admin"), desc: t("set.role.admin.desc") },
    { name: t("set.role.estimator"), desc: t("set.role.estimator.desc") },
    { name: t("set.role.sales"), desc: t("set.role.sales.desc") },
    { name: t("set.role.viewer"), desc: t("set.role.viewer.desc") },
  ];

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-8 py-5">
        <h1 className="font-display text-2xl font-semibold">{t("set.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("set.subtitle")}</p>
      </header>
      <div className="flex-1 overflow-y-auto finder-scroll p-8 space-y-6 max-w-3xl">
        <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <h2 className="mb-1 font-display text-base font-semibold">Company Profile</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Shown on estimates, printouts, and PDFs sent to your customers.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company Name" field="name" placeholder="Your Company Name" />
            <Field label="License Number" field="license" placeholder="CSLB 0000000" />
            <Field label="Phone" field="phone" placeholder="(510) 555-0100" />
            <Field label="Email" field="email" type="email" placeholder="info@company.com" />
            <div className="sm:col-span-2">
              <Field label="Address" field="address" placeholder="Street, City, State ZIP" />
            </div>
            <Field label="Website" field="website" placeholder="www.company.com" />
            <Field label="Logo URL" field="logoUrl" placeholder="https://…/logo.png" />
            <Field label="Default Tax Rate (%)" field="taxRate" type="number" placeholder="0" />
          </div>
          {profile.logoUrl && (
            <div className="mt-4 flex items-center gap-3 rounded-md border border-dashed border-border bg-secondary/30 p-3">
              <img src={profile.logoUrl} alt="Logo preview" className="h-12 w-12 rounded object-contain" />
              <span className="text-xs text-muted-foreground">Logo preview</span>
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => toast.success("Company profile saved")}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Save Changes
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <h2 className="mb-4 font-display text-base font-semibold">{t("set.roles")}</h2>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <div key={r.name} className="flex items-center justify-between rounded-md border border-border/60 px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                </div>
                <button className="rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-secondary">{t("set.edit")}</button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <h2 className="mb-1 font-display text-base font-semibold">{t("set.constructionItems")}</h2>
          <p className="mb-4 text-xs text-muted-foreground">{t("set.constructionItems.desc")}</p>
          <Link
            to="/price-book"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>{t("set.manageConstructionItems")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <h2 className="mb-2 font-display text-base font-semibold">{t("set.roadmap")}</h2>
          <p className="mb-3 text-xs text-muted-foreground">{t("set.roadmapHint")}</p>
          <ul className="space-y-1.5 text-sm">
            <li className="flex gap-2"><span className="text-muted-foreground">V2</span> AI floor-plan area detection · Zillow import · Permit estimator · Google Maps lookup</li>
            <li className="flex gap-2"><span className="text-muted-foreground">V3</span> Mobile on-site quoting · customer e-signature · online payments · project management</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
