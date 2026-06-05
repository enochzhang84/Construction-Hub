import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import {
  useProjects,
  formatDMY,
  statusBadgeClass,
  statusLabel,
  paymentLabel,
} from "@/lib/project-store";

export const Route = createFileRoute("/_authenticated/_authenticated/projects/detail/$id")({
  component: ProjectDetail,
});

function money(n: number) {
  return `$${n.toLocaleString()}`;
}

function ProjectDetail() {
  const { id } = useParams({ from: "/projects/detail/$id" });
  const t = useT();
  const locale = useLocale();
  const isZh = locale === "zh";
  const projects = useProjects((s) => s.projects);
  const project = projects.find((p) => p.id === id);
  const addons = projects.filter((p) => p.parentProjectId === id);

  if (!project) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        {isZh ? "未找到工程" : "Project not found"}
      </div>
    );
  }

  const discount = project.discount || 0;
  const finalAmount = project.amount - discount;

  return (
    <div className="h-full overflow-y-auto finder-scroll">
      <header className="border-b border-border bg-background/80 px-8 py-5 backdrop-blur">
        <Link to="/reports" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> {t("proj.back")}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{project.customerName}</h1>
            <p className="text-sm text-muted-foreground">{project.projectAddress}</p>
            <p className="mt-1 text-xs font-mono text-muted-foreground">
              {project.estimateNumber} · {project.customerPhone || "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={"rounded-md px-3 py-1.5 text-xs font-medium " + statusBadgeClass(project.status)}>
              {statusLabel(project.status, locale)}
            </span>
            <Link
              to="/projects/detail/$id/addon"
              params={{ id: project.id }}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> {t("proj.newAddon")}
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-8 p-8">
        {/* Meta */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Meta label={t("rep.col.issueDate")} value={formatDMY(project.issueDate)} />
          <Meta label={t("rep.col.startDate")} value={formatDMY(project.startDate)} />
          <Meta label={t("rep.col.settlementDate")} value={formatDMY(project.settlementDate)} />
          <Meta
            label={t("rep.col.payment")}
            value={project.paymentMethod ? paymentLabel(project.paymentMethod, locale) : "—"}
          />
          <Meta label={t("rep.col.date")} value={formatDMY(project.estimateDate)} />
        </section>

        {/* Original Estimate */}
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">{t("proj.original")}</h2>
          <div className="rounded-lg border border-border bg-card p-6 shadow-panel">
            <div className="grid grid-cols-3 gap-4 border-b border-border pb-4">
              <Stat label={t("proj.amount")} value={money(project.amount)} />
              <Stat label={t("proj.discount")} value={money(discount)} />
              <Stat label={t("proj.final")} value={money(finalAmount)} highlight />
            </div>
            <div className="pt-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("proj.lineItems")}
              </h3>
              {project.lineItems && project.lineItems.length > 0 ? (
                <LineTable items={project.lineItems} isZh={isZh} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isZh ? "未保存明细。" : "No line items saved."}
                </p>
              )}
            </div>
            {project.notes && (
              <div className="mt-4 border-t border-border pt-4">
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("rep.col.notes")}
                </h3>
                <p className="text-sm">{project.notes}</p>
              </div>
            )}
          </div>
        </section>

        {/* Add-ons */}
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">
            {t("proj.addons")} <span className="text-sm text-muted-foreground">({addons.length})</span>
          </h2>
          {addons.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t("proj.noAddons")}
            </div>
          ) : (
            <div className="space-y-3">
              {addons.map((a) => (
                <div key={a.id} className="rounded-lg border border-border bg-card p-5 shadow-panel">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display text-sm font-semibold">{a.addonNumber || a.estimateNumber}</div>
                      <div className="text-xs text-muted-foreground">{formatDMY(a.estimateDate)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{money(a.amount)}</span>
                      <span className={"rounded-md px-2 py-1 text-xs " + statusBadgeClass(a.status)}>
                        {statusLabel(a.status, locale)}
                      </span>
                    </div>
                  </div>
                  {a.lineItems && a.lineItems.length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <LineTable items={a.lineItems} isZh={isZh} />
                    </div>
                  )}
                  {a.notes && (
                    <p className="mt-2 text-xs italic text-muted-foreground">{a.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-panel">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm">{value}</div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={"mt-1 font-display text-2xl font-semibold " + (highlight ? "text-primary" : "")}>
        {value}
      </div>
    </div>
  );
}

function LineTable({
  items,
  isZh,
}: {
  items: NonNullable<ReturnType<typeof useProjects.getState>["projects"][number]["lineItems"]>;
  isZh: boolean;
}) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
        <tr>
          <th className="py-1.5 font-medium">{isZh ? "项目" : "Item"}</th>
          <th className="py-1.5 font-medium">{isZh ? "数量" : "Qty"}</th>
          <th className="py-1.5 font-medium">{isZh ? "单位" : "Unit"}</th>
          <th className="py-1.5 font-medium">{isZh ? "单价" : "Unit Price"}</th>
          <th className="py-1.5 text-right font-medium">{isZh ? "金额" : "Amount"}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((l) => (
          <tr key={l.id} className="border-t border-border/60">
            <td className="py-1.5">
              {l.name}
              {l.categoryName && (
                <span className="ml-2 text-xs text-muted-foreground">{l.categoryName}</span>
              )}
            </td>
            <td className="py-1.5 font-mono">{l.qty}</td>
            <td className="py-1.5">{l.unit}</td>
            <td className="py-1.5 font-mono">${l.unitPrice.toLocaleString()}</td>
            <td className="py-1.5 text-right font-mono">${l.amount.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
