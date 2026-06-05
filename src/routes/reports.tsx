import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { FileText, HardHat, Wallet, CheckCircle2, ArrowUpRight, CalendarIcon } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import {
  useProjects,
  summarizeProjects,
  formatDMY,
  statusBadgeClass,
  statusLabel,
  paymentLabel,
  STATUS_OPTIONS,
  PAYMENT_METHODS,
  type Project,
  type ProjectStatus,
  type PaymentMethod,
} from "@/lib/project-store";
import { useCustomers } from "@/lib/customer-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · Construction Hub" }] }),
  component: ReportsPage,
});

function money(n: number) {
  return `$${n.toLocaleString()}`;
}

function DatePickerCell({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange: (iso: string | undefined) => void;
  placeholder: string;
}) {
  const date = value ? new Date(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex w-full items-center gap-1.5 rounded-md border border-input bg-card px-2 py-1.5 text-xs font-mono hover:bg-secondary/60",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-3 w-3" />
          {value ? formatDMY(value) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0 pointer-events-auto">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? d.toISOString().slice(0, 10) : undefined)}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}

function ReportsPage() {
  const t = useT();
  const locale = useLocale();
  const isZh = locale === "zh";
  const projects = useProjects((s) => s.projects);
  const update = useProjects((s) => s.update);
  const customers = useCustomers((s) => s.customers);
  const customerById = useMemo(() => {
    const m = new Map<string, typeof customers[number]>();
    for (const c of customers) m.set(c.id, c);
    return m;
  }, [customers]);
  // Resolve live customer info via customerId (source of truth = Customers store);
  // fall back to snapshot fields when no link exists.
  const liveInfo = (p: Project) => {
    const c = p.customerId ? customerById.get(p.customerId) : null;
    return {
      name: c?.name ?? p.customerName,
      phone: c?.phone ?? p.customerPhone ?? "",
      address: c ? `${c.address}, ${c.city}, ${c.state} ${c.zip}` : p.projectAddress,
    };
  };
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
      status: isZh ? "等待客户确认" : "Awaiting approval",
      icon: FileText,
      tone: "info",
    },
    {
      to: "/projects/active",
      title: isZh ? "施工中工程" : "Active Projects",
      items: sum.active,
      amountLabel: isZh ? "合同金额" : "Contract Value",
      amount: money(sum.contractTotal),
      status: isZh ? "施工进行中" : "In progress",
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

  const records = projects.filter((p) => !p.parentProjectId);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-8 py-5">
        <h1 className="font-display text-2xl font-semibold">{t("rep.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("rep.subtitle")}</p>
      </header>
      <div className="flex-1 overflow-y-auto finder-scroll p-8 space-y-8">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{t("rep.pipeline")}</h2>
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
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{p.title}</div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-display text-3xl font-semibold tracking-tight">{p.items.length}</span>
                        <span className="text-xs text-muted-foreground">{isZh ? "个项目" : "projects"}</span>
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

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">{t("rep.records")}</h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-panel">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 font-medium">{t("rep.col.date")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("rep.col.customer")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("rep.col.address")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("rep.col.issueDate")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("rep.col.status")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("rep.col.startDate")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("rep.col.settlementDate")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("rep.col.payment")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("rep.col.notes")}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((p) => {
                  const info = liveInfo(p);
                  return (
                  <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                    <td className="px-3 py-2 font-mono text-xs">{formatDMY(p.estimateDate)}</td>
                    <td className="px-3 py-2">
                      <Link to="/projects/detail/$id" params={{ id: p.id }} className="font-medium hover:underline">
                        {info.name}
                      </Link>
                      <div className="font-mono text-[11px] text-muted-foreground">{info.phone || "—"}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{info.address}</td>
                    <td className="px-3 py-2">
                      <DatePickerCell
                        value={p.issueDate}
                        onChange={(d) => update(p.id, { issueDate: d })}
                        placeholder={t("rep.pickDate")}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={p.status}
                        onChange={(e) => update(p.id, { status: e.target.value as ProjectStatus })}
                        className={
                          "rounded-md border-0 px-2 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-ring/40 " +
                          statusBadgeClass(p.status)
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s, locale)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <DatePickerCell
                        value={p.startDate}
                        onChange={(d) => update(p.id, { startDate: d })}
                        placeholder={t("rep.pickDate")}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <DatePickerCell
                        value={p.settlementDate}
                        onChange={(d) => update(p.id, { settlementDate: d })}
                        placeholder={t("rep.pickDate")}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={p.paymentMethod || ""}
                        onChange={(e) =>
                          update(p.id, {
                            paymentMethod: (e.target.value || undefined) as PaymentMethod | undefined,
                          })
                        }
                        className="rounded-md border border-input bg-card px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                      >
                        <option value="">—</option>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {paymentLabel(m, locale)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        defaultValue={p.notes || ""}
                        onBlur={(e) => update(p.id, { notes: e.target.value })}
                        placeholder="—"
                        className="w-40 rounded-md border border-input bg-card px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    </td>
                  </tr>
                  );
                })}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      {isZh ? "暂无记录" : "No records"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
