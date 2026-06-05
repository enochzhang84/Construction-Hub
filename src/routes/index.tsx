import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, DollarSign, Send, CheckCircle2, Clock, Users, ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { useT, useLocale, tCategory } from "@/lib/i18n";
import { LanguageToggle } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Construction Hub" },
      { name: "description", content: "Monthly estimate metrics and revenue stats." },
    ],
  }),
  component: Dashboard,
});

const AMOUNTS = [42000, 31500, 28000, 24500, 22000, 18500, 15500, 12000, 9500, 7200];

function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function Dashboard() {
  const t = useT();
  const locale = useLocale();
  const isZh = locale === "zh";

  const STATS = [
    { label: t("dash.stat.estimatesMonth"), value: "27", delta: "+12%", icon: FileText },
    { label: t("dash.stat.closedRevenue"), value: "$184,250", delta: "+8.4%", icon: DollarSign },
    { label: t("dash.stat.awaiting"), value: "6", delta: t("dash.stat.actionNeeded"), icon: Clock, warn: true },
    { label: t("dash.stat.sent"), value: "11", delta: t("dash.stat.avgDays"), icon: Send },
    { label: t("dash.stat.closed"), value: "9", delta: isZh ? "本月 +2" : "+2 vs last mo.", icon: CheckCircle2 },
    { label: t("dash.stat.customers"), value: "48", delta: isZh ? "+5 新增" : "+5 new", icon: Users },
  ];

  const tradeRows = CATEGORIES.slice(0, 10).map((c, i) => ({
    name: tCategory(c, locale),
    amount: AMOUNTS[i],
  }));
  const max = Math.max(...tradeRows.map((r) => r.amount));
  const ytdTotal = tradeRows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="h-full overflow-y-auto finder-scroll">
      <header className="flex items-center justify-between border-b border-border bg-background/80 px-8 py-5 backdrop-blur">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{t("dash.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("dash.overview")} ·{" "}
            {new Date().toLocaleDateString(isZh ? "zh-CN" : "en-US", { month: "long", year: "numeric" })}
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

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6 shadow-panel">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("rep.ytd")}</div>
            <div className="mt-2 font-display text-4xl font-semibold tracking-tight">{fmtUSD(ytdTotal)}</div>
            <div className="mt-2 text-xs text-success">{t("rep.vsLast")}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 shadow-panel lg:col-span-2">
            <h2 className="mb-4 font-display text-base font-semibold">{t("rep.byTrade")}</h2>
            <div className="space-y-3">
              {tradeRows.map((r) => (
                <div key={r.name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{r.name}</span>
                    <span className="font-mono text-muted-foreground">{fmtUSD(r.amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary" style={{ width: `${(r.amount / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
