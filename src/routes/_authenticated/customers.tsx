import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  FileText,
  Pencil,
  Users,
  UserPlus,
  ClipboardList,
  Hammer,
  Wallet,
  CheckCircle2,
  Calendar,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Star,
  Archive,
  ArchiveRestore,
  Trash2,
  AlertTriangle,
  Gem,
  Crown,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { useCustomers } from "@/lib/customer-store";
import {
  useProjects,
  formatDMY,
  statusBadgeClass,
  statusLabel,
  paymentLabel,
  type Project,
  type ProjectStatus,
} from "@/lib/project-store";
import {
  CUSTOMER_SOURCES,
  CUSTOMER_FLAG_TYPES,
  type Customer,
  type CustomerSource,
  type CustomerFlag,
  type CustomerFlagType,
} from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { CustomerMap } from "@/components/CustomerMap";
import { CustomerTableView } from "@/components/CustomerTableView";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({ meta: [{ title: "Customers · Construction Hub" }] }),
  component: CustomersPage,
});

type ArchiveFilter = "active" | "archived" | "all";

function flagLabel(type: CustomerFlagType, locale: "en" | "zh"): string {
  const map: Record<CustomerFlagType, { en: string; zh: string }> = {
    VIP: { en: "VIP", zh: "VIP" },
    Loyal: { en: "Loyal", zh: "老客户" },
    Referral: { en: "Referral", zh: "推荐客户" },
    HighRisk: { en: "High Risk", zh: "高风险" },
    Custom: { en: "Custom", zh: "自定义" },
  };
  return map[type][locale];
}

function flagBadgeClass(type: CustomerFlagType): string {
  switch (type) {
    case "VIP":
      return "bg-[oklch(0.95_0.08_85)] text-[oklch(0.45_0.16_75)] dark:bg-[oklch(0.32_0.10_85)] dark:text-[oklch(0.88_0.12_85)]";
    case "Loyal":
      return "bg-[oklch(0.94_0.06_200)] text-[oklch(0.40_0.14_220)] dark:bg-[oklch(0.30_0.10_220)] dark:text-[oklch(0.88_0.10_220)]";
    case "Referral":
      return "bg-[oklch(0.94_0.06_150)] text-[oklch(0.40_0.14_150)] dark:bg-[oklch(0.30_0.10_150)] dark:text-[oklch(0.88_0.10_150)]";
    case "HighRisk":
      return "bg-[oklch(0.95_0.08_25)] text-[oklch(0.48_0.18_25)] dark:bg-[oklch(0.32_0.10_25)] dark:text-[oklch(0.88_0.12_25)]";
    case "Custom":
      return "bg-secondary text-foreground";
  }
}

function FlagIcon({ type, className }: { type: CustomerFlagType; className?: string }) {
  if (type === "VIP") return <Crown className={className} />;
  if (type === "HighRisk") return <AlertTriangle className={className} />;
  if (type === "Loyal") return <Gem className={className} />;
  return <Star className={className} />;
}


type FormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  unit: string;
  suite: string;
  building: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  notes: string;
  source: CustomerSource;
};

const EMPTY: FormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  unit: "",
  suite: "",
  building: "",
  city: "",
  state: "CA",
  zip: "",
  country: "United States",
  notes: "",
  source: "Website",
};

const PAGE_SIZES = [10, 20, 50];

function fmt$(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function matchesCustomer(p: Project, c: Customer): boolean {
  if (p.customerId && p.customerId === c.id) return true;
  if (!p.customerId && p.customerName === c.name) return true;
  return false;
}

function CustomersPage() {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const customers = useCustomers((s) => s.customers);
  const addCustomer = useCustomers((s) => s.addCustomer);
  const updateCustomer = useCustomers((s) => s.updateCustomer);
  const removeCustomer = useCustomers((s) => s.removeCustomer);
  const setFlag = useCustomers((s) => s.setFlag);
  const setArchived = useCustomers((s) => s.setArchived);
  const projects = useProjects((s) => s.projects);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>("active");
  const [selectedId, setSelectedId] = useState<string | null>(customers[0]?.id ?? null);
  const [viewTab, setViewTab] = useState<"table" | "cards" | "map">("table");

  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [flagDialog, setFlagDialog] = useState<{ customer: Customer } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ customer: Customer; projectCount: number } | null>(null);

  // Build enriched customer rows
  const enriched = useMemo(() => {
    return customers.map((c) => {
      const ps = projects.filter((p) => !p.parentProjectId && matchesCustomer(p, c));
      const latest = ps
        .slice()
        .sort((a, b) => (b.estimateDate || "").localeCompare(a.estimateDate || ""))[0];
      const estTotal = ps
        .filter((p) => p.status === "Estimate")
        .reduce((s, p) => s + (p.amount || 0), 0);
      const contractTotal = ps
        .filter((p) => p.status === "Active" || p.status === "Pending Payment" || p.status === "Completed")
        .reduce((s, p) => s + (p.amount || 0), 0);
      const due = ps.reduce((s, p) => s + Math.max(0, (p.amount || 0) - (p.paidAmount || 0)), 0);
      return { c, projects: ps, latest, estTotal, contractTotal, due };
    });
  }, [customers, projects]);

  // Distinct cities for filter
  const cities = useMemo(
    () => Array.from(new Set(customers.map((c) => c.city).filter(Boolean))).sort(),
    [customers],
  );

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const newThisMonth = customers.filter((c) => (c.createdAt || "").startsWith(ym)).length;
    const counts: Record<ProjectStatus, number> = {
      Estimate: 0,
      Active: 0,
      "Pending Payment": 0,
      Completed: 0,
      Cancelled: 0,
    };
    for (const row of enriched) {
      if (row.latest) counts[row.latest.status] += 1;
    }
    return { total: customers.length, newThisMonth, counts };
  }, [customers, enriched]);

  // Apply filters
  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return enriched.filter((row) => {
      const c = row.c;
      if (archiveFilter === "active" && c.isArchived) return false;
      if (archiveFilter === "archived" && !c.isArchived) return false;
      if (needle) {
        const hay = [c.name, c.phone, c.email, c.address, c.unit, c.suite, c.building, c.city, c.state, c.zip, c.country].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (statusFilter !== "all") {
        if (!row.latest || row.latest.status !== statusFilter) return false;
      }
      if (cityFilter !== "all" && c.city !== cityFilter) return false;
      if (sourceFilter !== "all" && (c.source ?? "Other") !== sourceFilter) return false;
      return true;
    });
  }, [enriched, q, statusFilter, cityFilter, sourceFilter, archiveFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Always keep a valid selection within filtered results
  const selectedRow =
    filtered.find((r) => r.c.id === selectedId) ?? paged[0] ?? enriched[0] ?? null;

  const openAdd = () => {
    setForm(EMPTY);
    setAddOpen(true);
  };

  const openEdit = (c: Customer) => {
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      unit: c.unit ?? "",
      suite: c.suite ?? "",
      building: c.building ?? "",
      city: c.city,
      state: c.state,
      zip: c.zip,
      country: c.country ?? "United States",
      notes: c.notes ?? "",
      source: c.source ?? "Website",
    });
    setEditingId(c.id);
  };

  const onSaveAdd = () => {
    if (!form.name.trim()) return;
    const c = addCustomer(form);
    setSelectedId(c.id);
    setAddOpen(false);
  };

  const onSaveEdit = () => {
    if (!editingId || !form.name.trim()) return;
    updateCustomer(editingId, form);
    setEditingId(null);
  };

  const createEstimateFor = (c: Customer) =>
    navigate({ to: "/estimates", search: { customerId: c.id } });

  const viewDetailFor = (c: Customer) => {
    const row = enriched.find((r) => r.c.id === c.id);
    const latest = row?.latest;
    if (latest) navigate({ to: "/projects/detail/$id", params: { id: latest.id } });
    else setSelectedId(c.id);
  };

  const projectCountFor = (c: Customer) =>
    projects.filter((p) => matchesCustomer(p, c)).length;

  const requestDelete = (c: Customer) => {
    setDeleteDialog({ customer: c, projectCount: projectCountFor(c) });
  };

  const confirmDelete = () => {
    if (!deleteDialog || deleteDialog.projectCount > 0) return;
    removeCustomer(deleteDialog.customer.id);
    if (selectedId === deleteDialog.customer.id) setSelectedId(null);
    setDeleteDialog(null);
  };

  const toggleArchive = (c: Customer) => setArchived(c.id, !c.isArchived);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-8 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("cust.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} / {customers.length} {t("cust.contacts")}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> {t("cust.new")}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto finder-scroll px-8 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard icon={<Users className="h-4 w-4" />} label={locale === "zh" ? "总客户数" : "Total Customers"} value={stats.total} tone="default" />
          <StatCard icon={<UserPlus className="h-4 w-4" />} label={locale === "zh" ? "本月新增" : "New This Month"} value={stats.newThisMonth} tone="blue" />
          <StatCard icon={<ClipboardList className="h-4 w-4" />} label={statusLabel("Estimate", locale)} value={stats.counts.Estimate} tone="blue" />
          <StatCard icon={<Hammer className="h-4 w-4" />} label={statusLabel("Active", locale)} value={stats.counts.Active} tone="amber" />
          <StatCard icon={<Wallet className="h-4 w-4" />} label={statusLabel("Pending Payment", locale)} value={stats.counts["Pending Payment"]} tone="green" />
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label={statusLabel("Completed", locale)} value={stats.counts.Completed} tone="default" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-panel">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={t("cust.search")}
              className="w-64 rounded-md border border-input bg-card py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v as "all" | ProjectStatus);
              setPage(1);
            }}
            label={locale === "zh" ? "状态" : "Status"}
            options={[
              { value: "all", label: locale === "zh" ? "全部" : "All" },
              { value: "Estimate", label: statusLabel("Estimate", locale) },
              { value: "Active", label: statusLabel("Active", locale) },
              { value: "Pending Payment", label: statusLabel("Pending Payment", locale) },
              { value: "Completed", label: statusLabel("Completed", locale) },
              { value: "Cancelled", label: statusLabel("Cancelled", locale) },
            ]}
          />
          <Select
            value={cityFilter}
            onChange={(v) => {
              setCityFilter(v);
              setPage(1);
            }}
            label={locale === "zh" ? "城市" : "City"}
            options={[
              { value: "all", label: locale === "zh" ? "全部城市" : "All Cities" },
              ...cities.map((c) => ({ value: c, label: c })),
            ]}
          />
          <Select
            value={sourceFilter}
            onChange={(v) => {
              setSourceFilter(v);
              setPage(1);
            }}
            label={locale === "zh" ? "来源" : "Source"}
            options={[
              { value: "all", label: locale === "zh" ? "全部来源" : "All Sources" },
              ...CUSTOMER_SOURCES.map((s) => ({ value: s, label: s })),
            ]}
          />
          <Select
            value={archiveFilter}
            onChange={(v) => {
              setArchiveFilter(v as ArchiveFilter);
              setPage(1);
            }}
            label={locale === "zh" ? "归档" : "View"}
            options={[
              { value: "active", label: locale === "zh" ? "活跃客户" : "Active" },
              { value: "archived", label: locale === "zh" ? "已归档" : "Archived" },
              { value: "all", label: locale === "zh" ? "全部" : "All" },
            ]}
          />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{locale === "zh" ? "每页" : "Per page"}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-md border border-input bg-card px-2 py-1.5 text-sm"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View tabs: Table / Cards / Map */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-panel w-fit">
          {([
            ["table", locale === "zh" ? "列表" : "List"],
            ["cards", locale === "zh" ? "卡片" : "Cards"],
            ["map", locale === "zh" ? "地图" : "Map"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setViewTab(key)}
              className={
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
                (viewTab === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {viewTab === "map" ? (
          <CustomerMap rows={filtered.map((r) => ({ c: r.c, latest: r.latest, estTotal: r.estTotal, contractTotal: r.contractTotal, due: r.due }))} />
        ) : viewTab === "table" ? (
          <CustomerTableView
            rows={paged}
            locale={locale}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={filtered.length}
            onPage={setPage}
            onSelect={(c) => setSelectedId(c.id)}
            onView={viewDetailFor}
            onEdit={openEdit}
            onNewEstimate={createEstimateFor}
            onFlag={(c) => setFlagDialog({ customer: c })}
            onToggleArchive={toggleArchive}
            onDelete={requestDelete}
          />
        ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(340px,400px)_1fr]">
          {/* Left: compact list */}
          <div className="flex flex-col rounded-lg border border-border bg-card shadow-panel overflow-hidden">
            <div className="border-b border-border bg-secondary/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {locale === "zh" ? "客户列表" : "Customer List"}
            </div>
            <div className="flex-1 overflow-y-auto">
              {paged.length === 0 && (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">—</div>
              )}
              {paged.map((row) => {
                const c = row.c;
                const isSel = selectedRow?.c.id === c.id;
                return (
                  <ContextMenu key={c.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedId(c.id)}
                        onDoubleClick={() => viewDetailFor(c)}
                        className={
                          "block w-full cursor-default border-b border-border/60 px-3 py-2.5 text-left transition-colors " +
                          (isSel ? "bg-primary/10" : "hover:bg-secondary/50") +
                          (c.isArchived ? " opacity-60" : "")
                        }
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate font-medium">{c.name}</span>
                            {c.flag && (
                              <span
                                title={c.flag.note || flagLabel(c.flag.type, locale)}
                                className={
                                  "inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium " +
                                  flagBadgeClass(c.flag.type)
                                }
                              >
                                <FlagIcon type={c.flag.type} className="h-3 w-3" />
                                {flagLabel(c.flag.type, locale)}
                              </span>
                            )}
                            {c.isArchived && (
                              <span className="shrink-0 rounded bg-secondary px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {locale === "zh" ? "已归档" : "Archived"}
                              </span>
                            )}
                          </div>
                          {row.latest && (
                            <span
                              className={
                                "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium " +
                                statusBadgeClass(row.latest.status)
                              }
                            >
                              {statusLabel(row.latest.status, locale)}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{c.city || "—"} · <span className="font-mono">{c.phone}</span></span>
                          {row.due > 0 && (
                            <span className="shrink-0 font-mono text-[oklch(0.48_0.16_50)]">
                              {fmt$(row.due)}
                            </span>
                          )}
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-52">
                      <ContextMenuItem onSelect={() => viewDetailFor(c)}>
                        <FileText className="mr-2 h-4 w-4" />
                        {locale === "zh" ? "查看客户详情" : "View Detail"}
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => openEdit(c)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {locale === "zh" ? "编辑客户" : "Edit Customer"}
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => createEstimateFor(c)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {locale === "zh" ? "新建报价单" : "New Estimate"}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onSelect={() => setFlagDialog({ customer: c })}>
                        <Star className="mr-2 h-4 w-4" />
                        {locale === "zh" ? "特别标记" : "Flag Customer"}
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => toggleArchive(c)}>
                        {c.isArchived ? (
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                        ) : (
                          <Archive className="mr-2 h-4 w-4" />
                        )}
                        {c.isArchived
                          ? locale === "zh"
                            ? "取消归档"
                            : "Unarchive"
                          : locale === "zh"
                            ? "归档客户"
                            : "Archive Customer"}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onSelect={() => requestDelete(c)}
                        className="text-[oklch(0.48_0.18_25)] focus:text-[oklch(0.48_0.18_25)]"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {locale === "zh" ? "删除客户" : "Delete Customer"}
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filtered.length)} / {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="rounded border border-input bg-card p-1 hover:bg-secondary disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-1">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="rounded border border-input bg-card p-1 hover:bg-secondary disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: customer detail */}
          <div className="rounded-lg border border-border bg-card shadow-panel">
            {selectedRow ? (
              <CustomerDetail
                row={selectedRow}
                onEdit={() => openEdit(selectedRow.c)}
                onNewEstimate={() => createEstimateFor(selectedRow.c)}
              />
            ) : (
              <div className="p-12 text-center text-sm text-muted-foreground">
                {locale === "zh" ? "选择一位客户查看详情" : "Select a customer to view details"}
              </div>
            )}
          </div>
        </div>
        )}
      </div>


      {/* Add dialog */}
      <CustomerDialog
        open={addOpen}
        title={t("cust.dlg.title")}
        form={form}
        setForm={setForm}
        onClose={() => setAddOpen(false)}
        onSave={onSaveAdd}
      />

      {/* Edit dialog */}
      <CustomerDialog
        open={!!editingId}
        title={locale === "zh" ? "编辑客户" : "Edit Customer"}
        form={form}
        setForm={setForm}
        onClose={() => setEditingId(null)}
        onSave={onSaveEdit}
      />

      {/* Flag dialog */}
      <FlagDialog
        open={!!flagDialog}
        customer={flagDialog?.customer ?? null}
        onClose={() => setFlagDialog(null)}
        onSave={(flag) => {
          if (flagDialog) setFlag(flagDialog.customer.id, flag);
          setFlagDialog(null);
        }}
      />

      {/* Delete confirmation */}
      <DeleteDialog
        info={deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={confirmDelete}
        onArchive={() => {
          if (deleteDialog) {
            setArchived(deleteDialog.customer.id, true);
            setDeleteDialog(null);
          }
        }}
      />
    </div>
  );
}

// ---------------- Detail panel ----------------

function CustomerDetail({
  row,
  onEdit,
  onNewEstimate,
}: {
  row: {
    c: Customer;
    projects: Project[];
    latest?: Project;
    estTotal: number;
    contractTotal: number;
    due: number;
  };
  onEdit: () => void;
  onNewEstimate: () => void;
}) {
  const locale = useLocale();
  const { c, projects, latest, estTotal, contractTotal, due } = row;

  // Main estimates (no parent) sorted desc
  const mainEstimates = projects
    .slice()
    .sort((a, b) => (b.estimateDate || "").localeCompare(a.estimateDate || ""));

  // Add-on / additional project records — linked to any of this customer's projects
  const projIds = new Set(projects.map((p) => p.id));
  // We need ALL projects from store to find addons referencing these IDs
  const allProjects = useProjects((s) => s.projects);
  const addons = allProjects
    .filter((p) => p.parentProjectId && projIds.has(p.parentProjectId))
    .sort((a, b) => (b.estimateDate || "").localeCompare(a.estimateDate || ""));

  // Payment records — derived from projects with paidAmount
  const paid = projects.filter((p) => (p.paidAmount || 0) > 0);

  const L = locale === "zh"
    ? {
        info: "客户资料", status: "工程状态", history: "历史报价单",
        addons: "新增施工项目", payments: "付款记录",
        viewDetail: "查看详情", newEst: "新建报价单", edit: "编辑客户",
        created: "创建日期", start: "开工日期", settle: "结算日期", method: "结款方式",
        none: "暂无记录", source: "来源", quoteTotal: "报价金额", contractTotal: "合同金额", outstanding: "待收款",
        date: "日期", amount: "金额", balance: "余额", noProject: "暂无项目",
      }
    : {
        info: "Customer Info", status: "Project Status", history: "Estimate History",
        addons: "Additional Projects", payments: "Payments",
        viewDetail: "View Detail", newEst: "New Estimate", edit: "Edit Customer",
        created: "Created", start: "Start Date", settle: "Settlement Date", method: "Payment Method",
        none: "No records", source: "Source", quoteTotal: "Quoted", contractTotal: "Contracted", outstanding: "Outstanding",
        date: "Date", amount: "Amount", balance: "Balance", noProject: "No active project",
      };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold">{c.name}</h2>
            {latest && (
              <span className={"rounded-md px-2 py-0.5 text-xs font-medium " + statusBadgeClass(latest.status)}>
                {statusLabel(latest.status, locale)}
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {L.created} {c.createdAt} {c.source ? `· ${L.source}: ${c.source}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {latest && (
            <Link
              to="/projects/detail/$id"
              params={{ id: latest.id }}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
            >
              <FileText className="h-3.5 w-3.5" /> {L.viewDetail}
            </Link>
          )}
          <button
            onClick={onNewEstimate}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> {L.newEst}
          </button>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            <Pencil className="h-3.5 w-3.5" /> {L.edit}
          </button>
        </div>
      </div>

      {/* Amount summary */}
      <div className="grid grid-cols-3 gap-px border-b border-border bg-border">
        <div className="bg-card px-5 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{L.quoteTotal}</div>
          <div className="mt-0.5 font-display text-lg font-semibold">{fmt$(estTotal)}</div>
        </div>
        <div className="bg-card px-5 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{L.contractTotal}</div>
          <div className="mt-0.5 font-display text-lg font-semibold">{fmt$(contractTotal)}</div>
        </div>
        <div className="bg-card px-5 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{L.outstanding}</div>
          <div className={"mt-0.5 font-display text-lg font-semibold " + (due > 0 ? "text-[oklch(0.48_0.16_50)]" : "")}>
            {fmt$(due)}
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-2">
        {/* Section 1: customer info */}
        <Section title={L.info}>
          <Row icon={<Phone className="h-3.5 w-3.5" />} text={c.phone || "—"} mono />
          <Row icon={<Mail className="h-3.5 w-3.5" />} text={c.email || "—"} />
          <Row
            icon={<MapPin className="h-3.5 w-3.5" />}
            text={[c.address, c.city, c.state, c.zip].filter(Boolean).join(", ") || "—"}
          />
          {c.notes && (
            <div className="mt-2 rounded border border-border/60 bg-secondary/30 p-2 text-xs italic text-muted-foreground">
              "{c.notes}"
            </div>
          )}
        </Section>

        {/* Section 2: project status */}
        <Section title={L.status}>
          {latest ? (
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className={"rounded px-2 py-0.5 text-xs font-medium " + statusBadgeClass(latest.status)}>
                  {statusLabel(latest.status, locale)}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{latest.estimateNumber}</span>
              </div>
              <Row icon={<Calendar className="h-3.5 w-3.5" />} text={`${L.start}: ${formatDMY(latest.startDate)}`} />
              <Row icon={<Calendar className="h-3.5 w-3.5" />} text={`${L.settle}: ${formatDMY(latest.settlementDate)}`} />
              <Row
                icon={<CreditCard className="h-3.5 w-3.5" />}
                text={`${L.method}: ${latest.paymentMethod ? paymentLabel(latest.paymentMethod, locale) : "—"}`}
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">{L.noProject}</div>
          )}
        </Section>

        {/* Section 3: estimate history (full width) */}
        <Section title={L.history} className="md:col-span-2">
          {mainEstimates.length === 0 ? (
            <div className="text-sm text-muted-foreground">{L.none}</div>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">{L.date}</th>
                    <th className="px-3 py-2 font-medium text-right">{L.amount}</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mainEstimates.map((p) => (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="px-3 py-2 font-mono text-xs">
                        <Link to="/projects/detail/$id" params={{ id: p.id }} className="hover:underline">
                          {p.estimateNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{formatDMY(p.estimateDate)}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmt$(p.amount)}</td>
                      <td className="px-3 py-2">
                        <span className={"rounded-md px-2 py-0.5 text-xs font-medium " + statusBadgeClass(p.status)}>
                          {statusLabel(p.status, locale)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Section 4: add-on / additional project records */}
        <Section title={L.addons}>
          {addons.length === 0 ? (
            <div className="text-sm text-muted-foreground">{L.none}</div>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {addons.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5 last:border-0">
                  <span className="text-xs text-muted-foreground font-mono">{formatDMY(a.estimateDate)}</span>
                  <span className="flex-1 truncate px-2">{a.notes || a.estimateNumber}</span>
                  <span className="font-mono text-xs">{fmt$(a.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Section 5: payment records */}
        <Section title={L.payments}>
          {paid.length === 0 ? (
            <div className="text-sm text-muted-foreground">{L.none}</div>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">{L.date}</th>
                    <th className="px-3 py-2 font-medium">{L.method}</th>
                    <th className="px-3 py-2 font-medium text-right">{L.amount}</th>
                    <th className="px-3 py-2 font-medium text-right">{L.balance}</th>
                  </tr>
                </thead>
                <tbody>
                  {paid.map((p) => (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="px-3 py-2 font-mono text-xs">{formatDMY(p.settlementDate || p.startDate || p.estimateDate)}</td>
                      <td className="px-3 py-2 text-xs">{p.paymentMethod ? paymentLabel(p.paymentMethod, locale) : "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmt$(p.paidAmount)}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmt$(Math.max(0, p.amount - p.paidAmount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

// ---------------- Small UI helpers ----------------

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "default" | "blue" | "amber" | "green";
}) {
  const toneCls =
    tone === "blue"
      ? "text-[oklch(0.40_0.18_240)] bg-[oklch(0.95_0.04_240)] dark:bg-[oklch(0.30_0.10_240)] dark:text-[oklch(0.85_0.10_240)]"
      : tone === "amber"
        ? "text-[oklch(0.48_0.16_50)] bg-[oklch(0.95_0.06_55)] dark:bg-[oklch(0.32_0.10_55)] dark:text-[oklch(0.88_0.10_55)]"
        : tone === "green"
          ? "text-[oklch(0.40_0.14_150)] bg-[oklch(0.94_0.06_150)] dark:bg-[oklch(0.30_0.10_150)] dark:text-[oklch(0.88_0.10_150)]"
          : "text-muted-foreground bg-secondary";
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-panel">
      <div className="flex items-center gap-2">
        <span className={"inline-flex h-7 w-7 items-center justify-center rounded-md " + toneCls}>{icon}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Select({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-card px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"space-y-2 " + className}>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function Row({ icon, text, mono }: { icon: React.ReactNode; text: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="text-muted-foreground">{icon}</span>
      <span className={mono ? "font-mono text-xs text-foreground" : "text-foreground"}>{text}</span>
    </div>
  );
}

// ---------------- Add / Edit Dialog ----------------

function CustomerDialog({
  open,
  title,
  form,
  setForm,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  form: FormState;
  setForm: (f: FormState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const t = useT();
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm({ ...form, [k]: v });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
   <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium">{t("cust.f.name")}</label>
            <Input value={form.name} onChange={(v) => set("name", v)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("cust.f.phone")}</label>
            <Input value={form.phone} onChange={(v) => set("phone", v)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("cust.f.email")}</label>
            <Input value={form.email} onChange={(v) => set("email", v)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium">{t("cust.f.address")}</label>
            <Input value={form.address} onChange={(v) => set("address", v)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("cust.f.unit")}</label>
            <Input value={form.unit} onChange={(v) => set("unit", v)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("cust.f.suite")}</label>
            <Input value={form.suite} onChange={(v) => set("suite", v)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("cust.f.building")}</label>
            <Input value={form.building} onChange={(v) => set("building", v)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("cust.f.city")}</label>
            <Input value={form.city} onChange={(v) => set("city", v)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("cust.f.state")}</label>
            <Input value={form.state} onChange={(v) => set("state", v)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("cust.f.zip")}</label>
            <Input value={form.zip} onChange={(v) => set("zip", v)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("cust.f.country")}</label>
            <Input value={form.country} onChange={(v) => set("country", v)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Source</label>
            <select
              value={form.source}
              onChange={(e) => set("source", e.target.value as CustomerSource)}
              className="h-11 w-full rounded-[10px] border border-input bg-background px-3.5 text-sm outline-none transition-colors hover:border-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              {CUSTOMER_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium">{t("cust.f.notes")}</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="h-11 w-full rounded-[10px] border border-input bg-background px-3.5 text-sm outline-none transition-colors hover:border-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onSave}
            className="inline-flex h-10 items-center justify-center rounded-[10px] bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            {t("common.save")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-[10px] border border-input bg-background px-3.5 text-sm outline-none transition-colors hover:border-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/15"
    />
  );
}

// ---------------- Flag dialog ----------------

function FlagDialog({
  open,
  customer,
  onClose,
  onSave,
}: {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSave: (flag: CustomerFlag | null) => void;
}) {
  const locale = useLocale();
  const [type, setType] = useState<CustomerFlagType>("VIP");
  const [note, setNote] = useState("");

  // Sync when opening a new customer
  const currentId = customer?.id ?? null;
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  if (open && currentId !== syncedFor) {
    setType(customer?.flag?.type ?? "VIP");
    setNote(customer?.flag?.note ?? "");
    setSyncedFor(currentId);
  }
  if (!open && syncedFor !== null) {
    // Reset sync when closed
    setTimeout(() => setSyncedFor(null), 0);
  }

  const L = locale === "zh"
    ? { title: "特别标记", type: "标记类型", note: "备注", clear: "清除标记", cancel: "取消", save: "保存", ph: "例如：客户经常临时修改施工范围" }
    : { title: "Flag Customer", type: "Flag Type", note: "Note", clear: "Clear Flag", cancel: "Cancel", save: "Save", ph: "e.g. Frequently changes scope mid-project" };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-4 w-4" /> {L.title}
            {customer && <span className="text-sm font-normal text-muted-foreground">— {customer.name}</span>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{L.type}</label>
            <div className="grid grid-cols-2 gap-2">
              {CUSTOMER_FLAG_TYPES.map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => setType(ft)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors " +
                    (type === ft
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-input bg-card hover:bg-secondary")
                  }
                >
                  <FlagIcon type={ft} className="h-3.5 w-3.5" />
                  {flagLabel(ft, locale)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{L.note}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={L.ph}
              className="h-11 w-full rounded-[10px] border border-input bg-background px-3.5 text-sm outline-none transition-colors hover:border-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <button
            onClick={() => onSave(null)}
            className="rounded-md border border-input bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
          >
            {L.clear}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {L.cancel}
            </button>
            <button
              onClick={() => onSave({ type, note: note.trim() || undefined })}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              {L.save}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Delete dialog ----------------

function DeleteDialog({
  info,
  onClose,
  onConfirm,
  onArchive,
}: {
  info: { customer: Customer; projectCount: number } | null;
  onClose: () => void;
  onConfirm: () => void;
  onArchive: () => void;
}) {
  const locale = useLocale();
  const open = !!info;
  const blocked = (info?.projectCount ?? 0) > 0;

  const L = locale === "zh"
    ? {
        title: "删除客户",
        confirm: `确定要删除客户 "${info?.customer.name ?? ""}" 吗？此操作无法撤销。`,
        blocked: "该客户存在关联的报价单或工程记录，无法直接删除。",
        suggest: "请改用「归档客户」以保留历史数据。",
        cancel: "取消",
        del: "删除",
        archive: "归档客户",
      }
    : {
        title: "Delete Customer",
        confirm: `Are you sure you want to delete "${info?.customer.name ?? ""}"? This cannot be undone.`,
        blocked: "This customer has related estimates or projects.",
        suggest: "Please archive this customer instead to preserve history.",
        cancel: "Cancel",
        del: "Delete",
        archive: "Archive",
      };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[oklch(0.48_0.18_25)]">
            <Trash2 className="h-4 w-4" /> {L.title}
          </DialogTitle>
        </DialogHeader>
        {blocked ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 rounded-md border border-[oklch(0.85_0.10_25)] bg-[oklch(0.97_0.04_25)] p-3 text-[oklch(0.40_0.18_25)] dark:bg-[oklch(0.25_0.08_25)] dark:text-[oklch(0.88_0.12_25)]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-medium">{L.blocked}</div>
                <div className="mt-1 text-xs opacity-80">{L.suggest}</div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{L.confirm}</p>
        )}
        <DialogFooter>
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {L.cancel}
          </button>
          {blocked ? (
            <button
              onClick={onArchive}
              className="inline-flex items-center gap-1.5 inline-flex h-10 items-center justify-center rounded-[10px] bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <Archive className="h-4 w-4" /> {L.archive}
            </button>
          ) : (
            <button
              onClick={onConfirm}
              className="inline-flex items-center gap-1.5 rounded-md bg-[oklch(0.55_0.20_25)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Trash2 className="h-4 w-4" /> {L.del}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
