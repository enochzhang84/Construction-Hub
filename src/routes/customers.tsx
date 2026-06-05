import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Mail, Phone, MapPin, FileText } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { useCustomers } from "@/lib/customer-store";
import { useProjects, formatDMY, statusBadgeClass, statusLabel } from "@/lib/project-store";
import type { Customer } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers · Construction Hub" }] }),
  component: CustomersPage,
});

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "CA",
  zip: "",
  notes: "",
};

function CustomersPage() {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const customers = useCustomers((s) => s.customers);
  const addCustomer = useCustomers((s) => s.addCustomer);
  const projects = useProjects((s) => s.projects);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [detail, setDetail] = useState<Customer | null>(null);

  const detailEstimates = useMemo(() => {
    if (!detail) return [];
    return projects
      .filter(
        (p) =>
          !p.parentProjectId &&
          (p.customerName === detail.name ||
            (detail.phone && p.customerPhone === detail.phone)),
      )
      .sort((a, b) => (b.estimateDate || "").localeCompare(a.estimateDate || ""));
  }, [projects, detail]);

  const createEstimateFor = (c: Customer) => {
    setDetail(null);
    navigate({ to: "/estimates", search: { customerId: c.id } });
  };

  const filtered = customers.filter((c) =>
    [c.name, c.email, c.address, c.city].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  // Most recent project per customerName (skip add-on entries)
  const recent = useMemo(() => {
    const map = new Map<string, typeof projects[number]>();
    for (const p of projects) {
      if (p.parentProjectId) continue;
      const cur = map.get(p.customerName);
      if (!cur || (p.estimateDate || "") > (cur.estimateDate || "")) {
        map.set(p.customerName, p);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      (b.estimateDate || "").localeCompare(a.estimateDate || ""),
    );
  }, [projects]);

  const onSave = () => {
    if (!form.name.trim()) return;
    addCustomer(form);
    setForm(EMPTY);
    setOpen(false);
  };

  const field = (k: keyof typeof EMPTY) => (
    <input
      value={form[k]}
      onChange={(e) => setForm({ ...form, [k]: e.target.value })}
      className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
    />
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-8 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("cust.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} {t("cust.contacts")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("cust.search")}
              className="w-64 rounded-md border border-input bg-card py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> {t("cust.new")}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto finder-scroll p-8 space-y-8">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-border bg-card p-5 shadow-panel transition-shadow hover:shadow-soft"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-base font-semibold">{c.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {t("cust.added")} {c.createdAt}
                  </div>
                </div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {c.state}
                </span>
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="font-mono text-xs">{c.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="text-xs">{c.email}</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5" />
                  <span className="text-xs">
                    {c.address}, {c.city}, {c.state} {c.zip}
                  </span>
                </div>
              </div>
              {c.notes && (
                <p className="mt-3 border-t border-border/60 pt-3 text-xs italic text-muted-foreground">
                  "{c.notes}"
                </p>
              )}
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">{t("cust.recent")}</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-panel">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{t("dash.col.name")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("dash.col.phone")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("dash.col.address")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("cust.col.lastDate")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("cust.col.lastStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">—</td></tr>
                )}
                {recent.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium">
                      <Link to="/projects/detail/$id" params={{ id: p.id }} className="hover:underline">
                        {p.customerName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{p.customerPhone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.projectAddress}</td>
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
        </section>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("cust.dlg.title")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium">{t("cust.f.name")}</label>
              {field("name")}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">{t("cust.f.phone")}</label>
              {field("phone")}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">{t("cust.f.email")}</label>
              {field("email")}
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium">{t("cust.f.address")}</label>
              {field("address")}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">{t("cust.f.city")}</label>
              {field("city")}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">{t("cust.f.state")}</label>
              {field("state")}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">{t("cust.f.zip")}</label>
              {field("zip")}
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium">{t("cust.f.notes")}</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={onSave}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {t("common.save")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
