import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, DollarSign, Send, CheckCircle2, Clock, Users, ArrowUpRight } from "lucide-react";
import { SEED_CUSTOMERS } from "@/lib/data";
import { useT, useLocale } from "@/lib/i18n";
import { LanguageToggle } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Construction Hub" },
      { name: "description", content: "Monthly estimate metrics, pipeline, and recent customers." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const t = useT();
  const locale = useLocale();
  const STATS = [
    { label: t("dash.stat.estimatesMonth"), value: "27", delta: "+12%", icon: FileText },
    { label: t("dash.stat.closedRevenue"), value: "$184,250", delta: "+8.4%", icon: DollarSign },
    { label: t("dash.stat.awaiting"), value: "6", delta: t("dash.stat.actionNeeded"), icon: Clock, warn: true },
    { label: t("dash.stat.sent"), value: "11", delta: t("dash.stat.avgDays"), icon: Send },
    { label: t("dash.stat.closed"), value: "9", delta: locale === "zh" ? "本月 +2" : "+2 vs last mo.", icon: CheckCircle2 },
    { label: t("dash.stat.customers"), value: "48", delta: locale === "zh" ? "+5 新增" : "+5 new", icon: Users },
  ];
  return (
    <div className="h-full overflow-y-auto finder-scroll">
      <header className="flex items-center justify-between border-b border-border bg-background/80 px-8 py-5 backdrop-blur">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{t("dash.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("dash.overview")} ·{" "}
            {new Date().toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            to="/estimates"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {t("dash.newEstimate")} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="space-y-8 p-8">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-lg border border-border bg-card p-5 shadow-panel">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</div>
                    <div className="mt-2 font-display text-3xl font-semibold tracking-tight">{s.value}</div>
                  </div>
                  <div className="rounded-md bg-secondary p-2"><Icon className="h-4 w-4" /></div>
                </div>
                <div className={"mt-3 text-xs " + ((s as any).warn ? "text-warning" : "text-muted-foreground")}>{s.delta}</div>
              </div>
            );
          })}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{t("dash.recentCustomers")}</h2>
            <Link to="/customers" className="text-xs text-muted-foreground hover:text-foreground">{t("dash.viewAll")}</Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-panel">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{t("dash.col.name")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("dash.col.address")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("dash.col.phone")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("dash.col.notes")}</th>
                </tr>
              </thead>
              <tbody>
                {SEED_CUSTOMERS.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.address}, {c.city}, {c.state}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
