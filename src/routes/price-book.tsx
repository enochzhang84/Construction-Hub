import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Pencil } from "lucide-react";
import { CATEGORIES, PRICING_TYPES, type PriceItem } from "@/lib/data";
import { useT, useLocale, tCategory, tItem, tPricing, tUnit } from "@/lib/i18n";
import { useMergedPriceItems, usePriceBookStore } from "@/lib/price-book-store";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/price-book")({
  head: () => ({ meta: [{ title: "Price Book · Construction Hub" }] }),
  component: PriceBookPage,
});

const PAGE_SIZE = 10;

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

type SortKey = "cat" | "name" | "unit" | "pricing" | "labor" | "material" | "combined";
type SortDir = "asc" | "desc";

function PriceBookPage() {
  const t = useT();
  const locale = useLocale();
  const items = useMergedPriceItems();
  const updateItem = usePriceBookStore((s) => s.updateItem);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("cat");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PriceItem | null>(null);

  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    let r = items
      .filter((i) => cat === "all" || i.categoryId === cat)
      .filter((i) =>
        (i.name + " " + (i.nameZh ?? "")).toLowerCase().includes(needle),
      )
      .map((i) => ({ ...i, cat: CATEGORIES.find((c) => c.id === i.categoryId)! }));

    const dir = sortDir === "asc" ? 1 : -1;
    r.sort((a, b) => {
      const va: string | number =
        sortKey === "cat"
          ? tCategory(a.cat, locale)
          : sortKey === "name"
            ? tItem(a, locale)
            : sortKey === "unit"
              ? a.unit
              : sortKey === "pricing"
                ? a.defaultPricing
                : sortKey === "labor"
                  ? a.laborRate
                  : sortKey === "material"
                    ? a.materialRate
                    : a.laborRate + a.materialRate;
      const vb: string | number =
        sortKey === "cat"
          ? tCategory(b.cat, locale)
          : sortKey === "name"
            ? tItem(b, locale)
            : sortKey === "unit"
              ? b.unit
              : sortKey === "pricing"
                ? b.defaultPricing
                : sortKey === "labor"
                  ? b.laborRate
                  : sortKey === "material"
                    ? b.materialRate
                    : b.laborRate + b.materialRate;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return r;
  }, [items, q, cat, sortKey, sortDir, locale]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const onSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? (
      <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-50" />
    ) : sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );

  const Th = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: "left" | "right" }) => (
    <th
      onClick={() => onSort(k)}
      className={`cursor-pointer select-none px-4 py-2.5 font-medium hover:text-foreground ${align === "right" ? "text-right" : ""}`}
    >
      {label}
      <SortIcon k={k} />
    </th>
  );

  // Build the page list (compact)
  const pages: number[] = [];
  const maxBtns = 5;
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + maxBtns - 1);
  start = Math.max(1, end - maxBtns + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-8 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("pb.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} {t("pb.items")} {CATEGORIES.length} {t("pb.trades")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={cat}
            onChange={(e) => {
              setCat(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            aria-label={t("pb.filter.category")}
          >
            <option value="all">{t("common.all")}</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {tCategory(c, locale)}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={t("pb.search.item")}
              className="w-72 rounded-md border border-input bg-card py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto finder-scroll p-8">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-panel">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <Th k="cat" label={t("pb.col.trade")} />
                <Th k="name" label={t("pb.col.item")} />
                <Th k="unit" label={t("pb.col.unit")} />
                <Th k="pricing" label={t("pb.col.defaultPricing")} />
                <Th k="labor" label={t("pb.col.labor")} align="right" />
                <Th k="material" label={t("pb.col.material")} align="right" />
                <Th k="combined" label={t("pb.col.combined")} align="right" />
                <th className="px-4 py-2.5 font-medium text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-2.5 text-muted-foreground">{tCategory(r.cat, locale)}</td>
                  <td className="px-4 py-2.5 font-medium">{tItem(r, locale)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{tUnit(r.unit, locale)}</td>
                  <td className="px-4 py-2.5 text-xs">{tPricing(r.defaultPricing, locale)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{fmt(r.laborRate)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{fmt(r.materialRate)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold">
                    {fmt(r.laborRate + r.materialRate)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => setEditing(r)}
                      className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs hover:bg-secondary"
                    >
                      <Pencil className="h-3 w-3" /> {t("common.edit")}
                    </button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="rounded-md border border-input bg-card px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-40"
            >
              {t("pb.pager.prev")}
            </button>
            {pages.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`rounded-md border px-3 py-1.5 text-xs ${
                  p === currentPage
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card hover:bg-secondary"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="rounded-md border border-input bg-card px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-40"
            >
              {t("pb.pager.next")}
            </button>
          </div>
        )}
      </div>

      <EditDialog
        item={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (editing) updateItem(editing.id, patch);
          setEditing(null);
        }}
      />
    </div>
  );
}

function EditDialog({
  item,
  onClose,
  onSave,
}: {
  item: PriceItem | null;
  onClose: () => void;
  onSave: (patch: Partial<PriceItem>) => void;
}) {
  const t = useT();
  const [form, setForm] = useState<PriceItem | null>(item);

  // Sync when item changes
  if (item && (!form || form.id !== item.id)) setForm(item);
  if (!item || !form) {
    return (
      <Dialog open={false} onOpenChange={() => onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const combined = (form.laborRate || 0) + (form.materialRate || 0);

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("pb.edit.title")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("pb.f.trade")}</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("pb.col.unit")}</label>
            <input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium">{t("pb.f.item")} (EN)</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium">{t("pb.f.item")} (中文)</label>
            <input
              value={form.nameZh ?? ""}
              onChange={(e) => setForm({ ...form, nameZh: e.target.value })}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium">{t("pb.col.defaultPricing")}</label>
            <select
              value={form.defaultPricing}
              onChange={(e) =>
                setForm({ ...form, defaultPricing: e.target.value as PriceItem["defaultPricing"] })
              }
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            >
              {PRICING_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("pb.col.labor")}</label>
            <input
              type="number"
              step="0.01"
              value={form.laborRate}
              onChange={(e) => setForm({ ...form, laborRate: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("pb.col.material")}</label>
            <input
              type="number"
              step="0.01"
              value={form.materialRate}
              onChange={(e) => setForm({ ...form, materialRate: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium">{t("pb.col.combined")}</label>
            <div className="rounded-md border border-dashed border-border bg-secondary/40 px-3 py-2 text-sm font-mono font-semibold">
              {fmt(combined)}
            </div>
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium">{t("cust.f.notes")}</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="rounded-md border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={() =>
              onSave({
                categoryId: form.categoryId,
                name: form.name,
                nameZh: form.nameZh,
                unit: form.unit,
                defaultPricing: form.defaultPricing,
                laborRate: form.laborRate,
                materialRate: form.materialRate,
                notes: form.notes,
              })
            }
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {t("common.save")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
