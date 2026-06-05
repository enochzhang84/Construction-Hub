import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileText,
  HardHat,
  Wallet,
  CheckCircle2,
  ArrowUpRight,
  CalendarIcon,
  Search,
  MapPin,
  Phone,
  StickyNote,
  ChevronRight,
} from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports · Construction Hub" }] }),
  component: ReportsPage,
});

function money(n: number) {
  return `$${n.toLocaleString()}`;
}

// Accent color per status — used on the left strip of project cards and stage cards.
function statusAccent(s: ProjectStatus): string {
  switch (s) {
    case "Estimate":
      return "oklch(0.62 0.18 240)";
    case "Active":
      return "oklch(0.66 0.18 50)";
    case "Pending Payment":
      return "oklch(0.58 0.16 150)";
    case "Completed":
      return "oklch(0.65 0.005 60)";
    case "Cancelled":
      return "oklch(0.60 0.18 25)";
  }
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
            "inline-flex h-7 items-center gap-1.5 rounded-md border border-input bg-card px-2 text-[11px] font-mono hover:bg-secondary/60",
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
    key: ProjectStatus | "all";
    to: "/projects/estimate" | "/projects/active" | "/projects/pending" | "/projects/completed";
    title: string;
    items: Project[];
    amountLabel: string;
    amount: string;
    status: string;
    icon: typeof FileText;
  }> = [
    {
      key: "Estimate",
      to: "/projects/estimate",
      title: isZh ? "施工报价单" : "Estimates",
      items: sum.estimates,
      amountLabel: isZh ? "总报价" : "Total Estimated",
      amount: money(sum.estimateTotal),
      status: isZh ? "等待客户确认" : "Awaiting approval",
      icon: FileText,
    },
    {
      key: "Active",
      to: "/projects/active",
      title: isZh ? "施工中工程" : "Active Projects",
      items: sum.active,
      amountLabel: isZh ? "合同金额" : "Contract Value",
      amount: money(sum.contractTotal),
      status: isZh ? "施工进行中" : "In progress",
      icon: HardHat,
    },
    {
      key: "Pending Payment",
      to: "/projects/pending",
      title: isZh ? "待结算单据" : "Pending Payment",
      items: sum.pending,
      amountLabel: isZh ? "待收款" : "Outstanding",
      amount: money(sum.pendingDue),
      status: isZh ? "等待尾款" : "Awaiting final payment",
      icon: Wallet,
    },
    {
      key: "Completed",
      to: "/projects/completed",
      title: isZh ? "已完成工程" : "Completed",
      items: sum.completed,
      amountLabel: isZh ? "完成数量" : "Completed",
      amount: String(sum.completed.length),
      status: isZh ? "工程已交付" : "Delivered",
      icon: CheckCircle2,
    },
  ];

  const allRecords = useMemo(() => projects.filter((p) => !p.parentProjectId), [projects]);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");

  const records = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allRecords.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!needle) return true;
      const info = liveInfo(p);
      const hay = [info.name, info.phone, info.address, p.estimateNumber, p.notes ?? ""].join(" ").toLowerCase();
      return hay.includes(needle);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRecords, q, statusFilter, customerById]);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-background/85 px-8 py-5 backdrop-blur">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{t("rep.title")}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t("rep.subtitle")}</p>
      </header>
      <div className="flex-1 overflow-y-auto finder-scroll p-8 space-y-8">
        {/* Stage cards */}
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
              const accent = statusAccent(p.key as ProjectStatus);
              const recent = p.items[0];
              return (
                <Link
                  key={p.to}
                  to={p.to}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-panel transition-all hover:-translate-y-0.5 hover:shadow-soft"
                  style={{ borderTop: `3px solid ${accent}` }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {p.title}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-display text-[32px] font-semibold leading-none tracking-tight tabular-nums">
                          {p.items.length}
                        </span>
                        <span className="text-xs text-muted-foreground">{isZh ? "个项目" : "projects"}</span>
                      </div>
                    </div>
                    <div
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: accent + "22", color: accent }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-5 border-t border-border/60 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{p.amountLabel}</span>
                      <span className="font-mono font-semibold tabular-nums">{p.amount}</span>
                    </div>
                    <div className="text-[11px] font-medium" style={{ color: accent }}>
                      {p.status}
                    </div>
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

        {/* Records list */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">{t("rep.records")}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={isZh ? "搜索客户 / 地址 / 单号" : "Search customer / address / #"}
                  className="h-9 w-72 rounded-md border border-input bg-card pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div className="flex items-center gap-1 rounded-md border border-input bg-card p-1">
                <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
                  {isZh ? "全部" : "All"}
                </FilterChip>
                {STATUS_OPTIONS.filter((s) => s !== "Cancelled").map((s) => (
                  <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ background: statusAccent(s) }} />
                    {statusLabel(s, locale)}
                  </FilterChip>
                ))}
              </div>
            </div>
          </div>

          {/* Column hints */}
          <div className="grid grid-cols-[2.5fr_2fr_1.5fr_1.2fr_1.5fr_auto] gap-3 rounded-md border border-border bg-secondary/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>{t("rep.col.customer")}</span>
            <span>{t("rep.col.address")}</span>
            <span>{t("rep.col.status")}</span>
            <span className="text-right">{isZh ? "金额" : "Amount"}</span>
            <span>{isZh ? "日期" : "Dates"}</span>
            <span className="text-right">{t("rep.col.notes")}</span>
          </div>

          <div className="space-y-2">
            {records.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
                {isZh ? "暂无记录" : "No records"}
              </div>
            )}
            {records.map((p) => {
              const info = liveInfo(p);
              const accent = statusAccent(p.status);
              return (
                <article
                  key={p.id}
                  className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-panel transition-shadow hover:shadow-soft"
                >
                  <span
                    className="absolute left-0 top-0 h-full w-[3px]"
                    style={{ background: accent }}
                    aria-hidden
                  />
                  <div className="grid grid-cols-[2.5fr_2fr_1.5fr_1.2fr_1.5fr_auto] items-center gap-3 px-4 py-3">
                    {/* Customer */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to="/projects/detail/$id"
                          params={{ id: p.id }}
                          className="truncate font-medium hover:underline"
                        >
                          {info.name}
                        </Link>
                        <span className="font-mono text-[10px] text-muted-foreground">{p.estimateNumber}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span className="font-mono">{info.phone || "—"}</span>
                      </div>
                    </div>
                    {/* Address */}
                    <div className="flex min-w-0 items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="line-clamp-2">{info.address || "—"}</span>
                    </div>
                    {/* Status */}
                    <div>
                      <select
                        value={p.status}
                        onChange={(e) => update(p.id, { status: e.target.value as ProjectStatus })}
                        className={
                          "rounded-md border-0 px-2 py-1 text-[11px] font-medium outline-none focus:ring-2 focus:ring-ring/40 " +
                          statusBadgeClass(p.status)
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s, locale)}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1">
                        <select
                          value={p.paymentMethod || ""}
                          onChange={(e) =>
                            update(p.id, {
                              paymentMethod: (e.target.value || undefined) as PaymentMethod | undefined,
                            })
                          }
                          className="h-6 rounded-md border border-input bg-card px-1.5 text-[10px] text-muted-foreground outline-none focus:ring-2 focus:ring-ring/40"
                        >
                          <option value="">{isZh ? "付款方式" : "Payment"}</option>
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>
                              {paymentLabel(m, locale)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {/* Amount */}
                    <div className="text-right">
                      <div className="font-display text-base font-semibold tabular-nums">{money(p.amount)}</div>
                      {p.paidAmount > 0 && (
                        <div className="text-[10px] text-muted-foreground">
                          {isZh ? "已收 " : "Paid "}
                          <span className="font-mono">{money(p.paidAmount)}</span>
                        </div>
                      )}
                    </div>
                    {/* Dates */}
                    <div className="flex flex-col gap-1">
                      <DateRow label={t("rep.col.issueDate")}>
                        <DatePickerCell
                          value={p.issueDate}
                          onChange={(d) => update(p.id, { issueDate: d })}
                          placeholder={t("rep.pickDate")}
                        />
                      </DateRow>
                      <DateRow label={t("rep.col.startDate")}>
                        <DatePickerCell
                          value={p.startDate}
                          onChange={(d) => update(p.id, { startDate: d })}
                          placeholder={t("rep.pickDate")}
                        />
                      </DateRow>
                      <DateRow label={t("rep.col.settlementDate")}>
                        <DatePickerCell
                          value={p.settlementDate}
                          onChange={(d) => update(p.id, { settlementDate: d })}
                          placeholder={t("rep.pickDate")}
                        />
                      </DateRow>
                    </div>
                    {/* Notes + go */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <StickyNote className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        <input
                          defaultValue={p.notes || ""}
                          onBlur={(e) => update(p.id, { notes: e.target.value })}
                          placeholder="—"
                          className="h-7 w-44 rounded-md border border-input bg-card pl-6 pr-2 text-[11px] outline-none focus:ring-2 focus:ring-ring/40"
                        />
                      </div>
                      <Link
                        to="/projects/detail/$id"
                        params={{ id: p.id }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex items-center rounded px-2 py-1 text-[11px] font-medium transition-colors " +
        (active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

function DateRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-12 truncate text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
