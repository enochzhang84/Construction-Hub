import { createFileRoute, Link, useParams, Navigate } from "@tanstack/react-router";
import { useProjects, type ProjectStatus, formatDMY, statusBadgeClass, statusLabel } from "@/lib/project-store";
import { useT, useLocale } from "@/lib/i18n";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/projects/$status")({
  component: ProjectsByStatus,
});

const STATUS_MAP: Record<string, ProjectStatus> = {
  estimate: "Estimate",
  active: "Active",
  pending: "Pending Payment",
  completed: "Completed",
};

function ProjectsByStatus() {
  const { status } = useParams({ from: "/projects/$status" });
  const t = useT();
  const locale = useLocale();
  const projects = useProjects((s) => s.projects);

  const target = STATUS_MAP[status];
  if (!target) return <Navigate to="/dashboard" />;

  const list = projects.filter((p) => p.status === target && !p.parentProjectId);
  const isZh = locale === "zh";

  const titles: Record<ProjectStatus, { en: string; zh: string }> = {
    Estimate: { en: "Estimates", zh: "施工报价单" },
    Active: { en: "Active Projects", zh: "施工中工程" },
    "Pending Payment": { en: "Pending Payment", zh: "待结算单据" },
    Completed: { en: "Completed", zh: "已完成工程" },
    Cancelled: { en: "Cancelled", zh: "已取消" },
  };

  const money = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="h-full overflow-y-auto finder-scroll">
      <header className="flex items-center justify-between border-b border-border bg-background/80 px-8 py-5 backdrop-blur">
        <div>
          <Link to="/reports" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> {t("rep.title")}
          </Link>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {isZh ? titles[target].zh : titles[target].en}
          </h1>
          <p className="text-sm text-muted-foreground">
            {list.length} {isZh ? "条记录" : "records"}
          </p>
        </div>
      </header>

      <div className="p-8">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-panel">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{isZh ? "客户" : "Customer"}</th>
                <th className="px-4 py-2.5 font-medium">{isZh ? "项目地址" : "Project Address"}</th>
                <th className="px-4 py-2.5 font-medium">{isZh ? "金额" : "Amount"}</th>
                <th className="px-4 py-2.5 font-medium">{isZh ? "日期" : "Date"}</th>
                <th className="px-4 py-2.5 font-medium">{isZh ? "状态" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    {isZh ? "暂无记录" : "No records"}
                  </td>
                </tr>
              )}
              {list.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium">
                    <Link to="/projects/detail/$id" params={{ id: p.id }} className="hover:underline">
                      {p.customerName}
                    </Link>
                    {p.customerPhone && <div className="text-xs text-muted-foreground font-mono">{p.customerPhone}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.projectAddress}</td>
                  <td className="px-4 py-3 font-mono">{money(p.amount)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{formatDMY(p.estimateDate)}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-md px-2 py-1 text-xs font-medium " + statusBadgeClass(p.status)}>
                      {statusLabel(p.status, locale)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
