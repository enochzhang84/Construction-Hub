import { createFileRoute, Link } from "@tanstack/react-router";
import { useT, useLocale } from "@/lib/i18n";
import { useCompany, type CompanyProfile } from "@/lib/company-store";
import { useTerms, DEFAULT_TERMS_EN, DEFAULT_TERMS_ZH } from "@/lib/terms-store";
import { toast } from "sonner";
import { BookOpen, ChevronRight, FileText, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_authenticated/settings")({
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

        <TermsSection />

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

function TermsSection() {
  const locale = useLocale();
  const isZh = locale === "zh";
  const termsEn = useTerms((s) => s.termsEn);
  const termsZh = useTerms((s) => s.termsZh);
  const setTerms = useTerms((s) => s.setTerms);
  const resetDefaults = useTerms((s) => s.resetDefaults);

  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="mb-1 flex items-center gap-2 font-display text-base font-semibold">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {isZh ? "报价条款 (Terms & Conditions)" : "Terms & Conditions"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isZh
              ? "以下条款将自动附加到所有打印 / 导出的报价单底部，位于明细之后、签字栏之前。"
              : "Automatically appended to every printed and exported estimate, after line totals and before the signature block."}
          </p>
        </div>
        <button
          onClick={() => {
            resetDefaults();
            toast.success(isZh ? "已恢复默认条款" : "Reset to default terms");
          }}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-input bg-background px-3 text-xs font-medium hover:bg-secondary"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {isZh ? "恢复默认" : "Reset to default"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              English Terms
            </span>
            {termsEn !== DEFAULT_TERMS_EN && (
              <button
                onClick={() => setTerms({ termsEn: DEFAULT_TERMS_EN })}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                reset
              </button>
            )}
          </div>
          <textarea
            value={termsEn}
            onChange={(e) => setTerms({ termsEn: e.target.value })}
            rows={14}
            className="w-full rounded-[10px] border border-input bg-background px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed outline-none transition-colors hover:border-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
        <label className="block">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              中文条款
            </span>
            {termsZh !== DEFAULT_TERMS_ZH && (
              <button
                onClick={() => setTerms({ termsZh: DEFAULT_TERMS_ZH })}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                重置
              </button>
            )}
          </div>
          <textarea
            value={termsZh}
            onChange={(e) => setTerms({ termsZh: e.target.value })}
            rows={14}
            className="w-full rounded-[10px] border border-input bg-background px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed outline-none transition-colors hover:border-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => toast.success(isZh ? "条款已保存" : "Terms saved")}
          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
        >
          {isZh ? "保存条款" : "Save Terms"}
        </button>
      </div>
    </section>
  );
}
