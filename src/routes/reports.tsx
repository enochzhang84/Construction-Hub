import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, HardHat, Wallet, CheckCircle2, ArrowUpRight } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { useProjects, summarizeProjects, type Project } from "@/lib/project-store";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · Construction Hub" }] }),
  component: ReportsPage,
});

function money(n: number) {
  return `$${n.toLocaleString()}`;
}

function ReportsPage() {
  const t = useT();
  const locale = useLocale();
  const isZh = locale === "zh";
  const projects = useProjects((s) => s.projects);
  const sum = summarizeProjects(projects);

  const STAGES: Array<{
    to: "/projects/estimate" | "/projects/active" | "/projects/pending" | "/projects/completed";
    title: string;
    items: Project[];
    amountLabel: string;
    amount: string;
    status: string;
    icon: typeof FileText;
    tone: "info" | "warning" | "success" | "neutral";
  }> = [
    {
      to: "/projects/estimate",
      title: isZh ? "施工报价单" : "Estimates",
      items: sum.estimates,
      amountLabel: isZh ? "总报价" : "Total Estimated",
      amount: money(sum.estimateTotal),
      status: isZh ? "等待客户确认" : "Awaiting customer approval",
      icon: FileText,
      tone: "info",
    },
    {
      to: "/projects/active",
      title: isZh ? "施工中工程" : "Active Projects",
      items: sum.active,
      amountLabel: isZh ? "合同金额" : "Contract Value",
      amount: money(sum.contractTotal),
      status: isZh ? "施工进行中" : "Construction in progress",
      icon: HardHat,
      tone: "warning",
    },
    {
      to: "/projects/pending",
      title: isZh ? "待结算单据" : "Pending Payment",
      items: sum.pending,
      amountLabel: isZh ? "待收款" : "Outstanding",
      amount: money(sum.pendingDue),
      status: isZh ? "等待尾款" : "Awaiting final payment",
      icon: Wallet,
      tone: "success",
    },
    {
      to: "/projects/completed",
      title: isZh ? "已完成工程" : "Completed",
      items: sum.completed,
      amountLabel: isZh ? "完成数量" : "Completed",
      amount: String(sum.completed.length),
      status: isZh ? "工程已交付" : "Delivered",
      icon: CheckCircle2,
      tone: "neutral",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-8 py-5">
        <h1 className="font-display text-2xl font-semibold">{t("rep.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {isZh ? "工程状态与流程管理" : "Project pipeline & workflow management"}
        </p>
      </header>
      <div className="flex-1 overflow-y-auto finder-scroll p-8 space-y-6">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              {isZh ? "工程状态管理" : "Project Pipeline"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {isZh ? "报价 → 施工 → 结算 → 完成" : "Estimate → Active → Pending → Completed"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STAGES.map((p) => {
              const Icon = p.icon;
              const toneRing =
                p.tone === "info"
                  ? "before:bg-[oklch(0.62_0.18_240)]"
                  : p.tone === "warning"
                  ? "before:bg-[oklch(0.72_0.18_55)]"
                  : p.tone === "success"
                  ? "before:bg-[oklch(0.62_0.16_150)]"
                  : "before:bg-muted-foreground";
              const toneText =
                p.tone === "info"
                  ? "text-[oklch(0.55_0.18_240)]"
                  : p.tone === "warning"
                  ? "text-[oklch(0.58_0.18_50)]"
                  : p.tone === "success"
                  ? "text-[oklch(0.50_0.16_150)]"
                  : "text-muted-foreground";
              const recent = p.items[0];
              return (
                <Link
                  key={p.to}
                  to={p.to}
                  className={
                    "group relative overflow-hidden rounded-lg border border-border bg-card p-5 shadow-panel transition-all hover:shadow-md " +
                    "before:absolute before:left-0 before:top-0 before:h-full before:w-1 " +
                    toneRing
                  }
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {p.title}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-display text-3xl font-semibold tracking-tight">
                          {p.items.length}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isZh ? "个项目" : "projects"}
                        </span>
                      </div>
                    </div>
                    <div className={"rounded-md bg-secondary p-2 " + toneText}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4 border-t border-border/60 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{p.amountLabel}</span>
                      <span className="font-mono font-semibold">{p.amount}</span>
                    </div>
                    <div className={"text-xs " + toneText}>{p.status}</div>
                    {recent && (
                      <div className="truncate text-[11px] text-muted-foreground">
                        {isZh ? "最近：" : "Recent: "}
                        <span className="text-foreground/80">{recent.customerName}</span>
                      </div>
                    )}
                  </div>
                  <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
