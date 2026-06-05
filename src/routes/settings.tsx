import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Construction Hub" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const t = useT();
  const FIELDS = [
    { label: t("set.field.company"), value: "Bay Area Remodel Co." },
    { label: t("set.field.license"), value: "CSLB 1042918" },
    { label: t("set.field.address"), value: "1245 Industrial Way, Hayward, CA 94545" },
    { label: t("set.field.phone"), value: "(510) 555-0100" },
    { label: t("set.field.email"), value: "estimates@bayarearemodel.com" },
    { label: t("set.field.tax"), value: "9.25%" },
  ];
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
          <h2 className="mb-4 font-display text-base font-semibold">{t("set.company")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.label} className="block">
                <div className="mb-1 text-xs font-medium text-muted-foreground">{f.label}</div>
                <input
                  defaultValue={f.value}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
            ))}
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
