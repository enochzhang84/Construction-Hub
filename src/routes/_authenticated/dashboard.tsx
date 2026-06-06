import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  FileText,
  DollarSign,
  Send,
  CheckCircle2,
  Clock,
  Users,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Hammer,
  Wallet,
  PhoneCall,
  CalendarDays,
  Flag,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { LanguageToggle } from "@/components/AppShell";
import { useProjects, summarizeProjects } from "@/lib/project-store";
import { useCustomers } from "@/lib/customer-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Construction Hub" },
      { name: "description", content: "Monthly estimate metrics and revenue stats." },
    ],
  }),
  component: Dashboard,
});



function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const todayIso = () => new Date().toISOString().slice(0, 10);

function Dashboard() {
  const t = useT();
  const locale = useLocale();
  const isZh = locale === "zh";
  const projects = useProjects((s) => s.projects);
  const customers = useCustomers((s) => s.customers);
  const sum = summarizeProjects(projects);

  const focus = useMemo(() => {
    const td = todayIso();
    const followUps = sum.estimates.slice(0, 5);
    const collections = sum.pending.filter((p) => p.amount - p.paidAmount > 0).slice(0, 5);
    const todayStarts = projects.filter((p) => p.startDate === td).slice(0, 5);
    const todayCompletes = projects.filter((p) => p.settlementDate === td).slice(0, 5);
    return { followUps, collections, todayStarts, todayCompletes };
  }, [projects, sum]);

  const stats: Array<{
    label: string;
    value: string;
    delta: string;
    icon: typeof FileText;
    tone: "neutral" | "positive" | "warning" | "info";
    trend?: "up" | "down";
  }> = [
    {
      label: t("dash.stat.estimatesMonth"),
      value: String(sum.estimates.length),
      delta: "",
      icon: FileText,
      tone: "info",
    },
    {
      label: t("dash.stat.closedRevenue"),
      value: fmtUSD(sum.contractTotal),
      delta: "",
      icon: DollarSign,
      tone: "positive",
    },
    {
      label: t("dash.stat.awaiting"),
      value: String(focus.followUps.length),
      delta: "",
      icon: Clock,
      tone: "warning",
    },
    {
      label: t("dash.stat.sent"),
      value: String(sum.active.length),
      delta: "",
      icon: Send,
      tone: "neutral",
    },
    {
      label: t("dash.stat.closed"),
      value: String(sum.completed.length),
      delta: "",
      icon: CheckCircle2,
      tone: "positive",
    },
    {
      label: t("dash.stat.customers"),
      value: String(customers.length),
      delta: "",
      icon: Users,
      tone: "info",
    },
  ];

  const tradeRows: { name: string; amount: number }[] = [];
  const max = 1;
  const ytdTotal = sum.completed.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="h-full overflow-y-auto finder-scroll">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/85 px-8 py-5 backdrop-blur">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{t("dash.title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("dash.overview")} ·{" "}
            {new Date().toLocaleDateString(isZh ? "zh-CN" : "en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            to="/estimates"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            {t("dash.newEstimate")} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="space-y-6 p-8">
        {/* Today's Focus */}
        <section className="rounded-xl border border-border bg-card shadow-panel">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[oklch(0.95_0.04_240)] text-[oklch(0.40_0.18_240)]">
                <Flag className="h-3.5 w-3.5" />
              </span>
              <h2 className="font-display text-base font-semibold">{isZh ? "今日重点" : "Today's Focus"}</h2>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {new Date().toLocaleDateString(isZh ? "zh-CN" : "en-US", { weekday: "long" })}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-px bg-border/60 md:grid-cols-2 xl:grid-cols-4">
            <FocusColumn
              icon={<PhoneCall className="h-3.5 w-3.5" />}
              tone="blue"
              title={isZh ? "待跟进客户" : "Follow-ups"}
              count={focus.followUps.length}
              items={focus.followUps.map((p) => ({
                id: p.id,
                primary: p.customerName,
                secondary: fmtUSD(p.amount),
              }))}
              emptyLabel={isZh ? "无需跟进" : "Nothing pending"}
            />
            <FocusColumn
              icon={<Wallet className="h-3.5 w-3.5" />}
              tone="amber"
              title={isZh ? "待收款工程" : "Collections"}
              count={focus.collections.length}
              items={focus.collections.map((p) => ({
                id: p.id,
                primary: p.customerName,
                secondary: fmtUSD(p.amount - p.paidAmount),
              }))}
              emptyLabel={isZh ? "暂无待收款" : "Nothing outstanding"}
            />
            <FocusColumn
              icon={<Hammer className="h-3.5 w-3.5" />}
              tone="orange"
              title={isZh ? "今日开工" : "Starting Today"}
              count={focus.todayStarts.length}
              items={focus.todayStarts.map((p) => ({
                id: p.id,
                primary: p.customerName,
                secondary: p.projectAddress.split(",")[0],
              }))}
              emptyLabel={isZh ? "今日无开工" : "No starts today"}
            />
            <FocusColumn
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              tone="green"
              title={isZh ? "今日完工" : "Completing Today"}
              count={focus.todayCompletes.length}
              items={focus.todayCompletes.map((p) => ({
                id: p.id,
                primary: p.customerName,
                secondary: p.projectAddress.split(",")[0],
              }))}
              emptyLabel={isZh ? "今日无完工" : "No completions"}
            />
          </div>
        </section>

        {/* KPI strip */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((s) => {
            const Icon = s.icon;
            const iconTone =
              s.tone === "info"
                ? "bg-[oklch(0.95_0.04_240)] text-[oklch(0.40_0.18_240)]"
                : s.tone === "positive"
                  ? "bg-[oklch(0.94_0.06_150)] text-[oklch(0.40_0.14_150)]"
                  : s.tone === "warning"
                    ? "bg-[oklch(0.95_0.06_55)] text-[oklch(0.48_0.16_50)]"
                    : "bg-secondary text-muted-foreground";
            const trendCls =
              s.trend === "up"
                ? "text-[oklch(0.50_0.14_150)]"
                : s.trend === "down"
                  ? "text-[oklch(0.55_0.18_25)]"
                  : s.tone === "warning"
                    ? "text-[oklch(0.55_0.16_50)]"
                    : "text-muted-foreground";
            const TrendIcon = s.trend === "up" ? TrendingUp : s.trend === "down" ? TrendingDown : null;
            return (
              <div
                key={s.label}
                className="flex h-[124px] flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-panel transition-shadow hover:shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </span>
                  <span className={"inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md " + iconTone}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div>
                  <div className="font-display text-[28px] font-semibold leading-none tracking-tight tabular-nums">
                    {s.value}
                  </div>
                  <div className={"mt-2 inline-flex items-center gap-1 text-[11px] font-medium " + trendCls}>
                    {TrendIcon && <TrendIcon className="h-3 w-3" />}
                    {s.delta}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* YTD + Trade breakdown */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6 shadow-panel">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> {t("rep.ytd")}
            </div>
            <div className="mt-3 font-display text-4xl font-semibold tracking-tight tabular-nums">{fmtUSD(ytdTotal)}</div>
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[oklch(0.50_0.14_150)]">
              <TrendingUp className="h-3 w-3" /> {t("rep.vsLast")}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/60 pt-4 text-xs">
              <Mini label={isZh ? "施工中" : "Active"} value={String(sum.active.length)} />
              <Mini label={isZh ? "待结算" : "Pending"} value={String(sum.pending.length)} />
              <Mini label={isZh ? "已完成" : "Completed"} value={String(sum.completed.length)} />
              <Mini label={isZh ? "客户数" : "Customers"} value={String(customers.length)} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-panel lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">{t("rep.byTrade")}</h2>
              <Link to="/reports" className="text-xs text-muted-foreground hover:text-foreground">
                {t("dash.viewAll")}
              </Link>
            </div>
            <div className="space-y-2.5">
              {tradeRows.map((r) => (
                <div key={r.name} className="group">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{r.name}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">{fmtUSD(r.amount)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500 group-hover:bg-[oklch(0.40_0.18_240)]"
                      style={{ width: `${(r.amount / max) * 100}%` }}
                    />
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

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function FocusColumn({
  icon,
  tone,
  title,
  count,
  items,
  emptyLabel,
}: {
  icon: React.ReactNode;
  tone: "blue" | "amber" | "orange" | "green";
  title: string;
  count: number;
  items: { id: string; primary: string; secondary: string }[];
  emptyLabel: string;
}) {
  const toneCls =
    tone === "blue"
      ? "bg-[oklch(0.95_0.04_240)] text-[oklch(0.40_0.18_240)]"
      : tone === "amber"
        ? "bg-[oklch(0.95_0.06_55)] text-[oklch(0.48_0.16_50)]"
        : tone === "orange"
          ? "bg-[oklch(0.95_0.08_45)] text-[oklch(0.50_0.18_45)]"
          : "bg-[oklch(0.94_0.06_150)] text-[oklch(0.40_0.14_150)]";
  return (
    <div className="bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={"inline-flex h-6 w-6 items-center justify-center rounded-md " + toneCls}>{icon}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        </div>
        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">{count}</span>
      </div>
      {items.length === 0 ? (
        <div className="py-3 text-xs text-muted-foreground">{emptyLabel}</div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium">{it.primary}</span>
              <span className="shrink-0 font-mono text-muted-foreground">{it.secondary}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
