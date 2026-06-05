import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Pencil, Plus, Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { CATEGORIES, PRICING_TYPES, type PriceItem, type PricingType } from "@/lib/data";
import { useT, useLocale, tCategory, tItem, tPricing, tUnit } from "@/lib/i18n";
import { useMergedPriceItems, usePriceBookStore } from "@/lib/price-book-store";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/_authenticated/price-book")({
  head: () => ({ meta: [{ title: "Construction Items · Construction Hub" }] }),
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
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState<ImportRow[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const addItem = usePriceBookStore((s) => s.addItem);
  const upsertMany = usePriceBookStore((s) => s.upsertMany);

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

      <AddDialog
        open={adding}
        onClose={() => setAdding(false)}
        onSave={(item) => {
          addItem(item);
          setAdding(false);
        }}
      />

      <ImportPreviewDialog
        rows={importing}
        onClose={() => setImporting(null)}
        onConfirm={(rows) => {
          const res = upsertMany(rows);
          setImporting(null);
          alert(
            `${t("pb.import.done")}\n${t("pb.import.created")}: ${res.created}\n${t("pb.import.updated")}: ${res.updated}`,
          );
        }}
      />

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try {
            const buf = await f.arrayBuffer();
            const wb = XLSX.read(buf, { type: "array" });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
            const parsed = parseImportRows(json);
            setImporting(parsed);
          } catch (err) {
            alert("Import failed: " + (err as Error).message);
          }
        }}
      />

      {/* Floating Action Bar */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-30">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur">
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> {t("pb.fab.add")}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            <Upload className="h-4 w-4" /> {t("pb.fab.import")}
          </button>
          <button
            onClick={() => exportToExcel(rows)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            <Download className="h-4 w-4" /> {t("pb.fab.export")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Excel helpers ----------------

type ImportRow = {
  ok: boolean;
  error?: string;
  rowIndex: number;
  data: {
    categoryId: string;
    name: string;
    nameZh?: string;
    unit: string;
    defaultPricing: PricingType;
    laborRate: number;
    materialRate: number;
    notes?: string;
  };
  raw: Record<string, unknown>;
};

const HEADER_MAP: Record<string, string> = {
  trade: "category",
  category: "category",
  "施工分类": "category",
  分类: "category",
  item: "name",
  name: "name",
  "项目名称": "name",
  "name en": "name",
  "项目名称 en": "name",
  "项目名称en": "name",
  namezh: "nameZh",
  "name zh": "nameZh",
  "项目名称 中文": "nameZh",
  "项目名称中文": "nameZh",
  "中文": "nameZh",
  unit: "unit",
  "单位": "unit",
  pricing: "pricing",
  "default pricing": "pricing",
  "默认报价方式": "pricing",
  labor: "labor",
  "labor rate": "labor",
  "人工": "labor",
  material: "material",
  "material rate": "material",
  "材料": "material",
  combined: "combined",
  total: "combined",
  "合计": "combined",
  notes: "notes",
  note: "notes",
  "备注": "notes",
};

function normalizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = HEADER_MAP[k.trim().toLowerCase()] ?? k.trim().toLowerCase();
    out[key] = v;
  }
  return out;
}

function parseImportRows(json: Array<Record<string, unknown>>): ImportRow[] {
  return json.map((raw, i) => {
    const r = normalizeRow(raw);
    const categoryRaw = String(r.category ?? "").trim();
    const name = String(r.name ?? "").trim();
    const unit = String(r.unit ?? "").trim();
    const pricingRaw = String(r.pricing ?? "Labor + Material").trim();
    const labor = Number(r.labor ?? 0) || 0;
    const material = Number(r.material ?? 0) || 0;

    let error: string | undefined;
    const cat = CATEGORIES.find(
      (c) =>
        c.name.toLowerCase() === categoryRaw.toLowerCase() ||
        c.nameZh === categoryRaw ||
        c.id === categoryRaw.toLowerCase(),
    );
    if (!categoryRaw) error = "Missing category";
    else if (!cat) error = `Unknown category: ${categoryRaw}`;
    else if (!name) error = "Missing item name";
    else if (!unit) error = "Missing unit";

    const pricing = (PRICING_TYPES as string[]).includes(pricingRaw)
      ? (pricingRaw as PricingType)
      : "Labor + Material";

    return {
      ok: !error,
      error,
      rowIndex: i + 2, // header is row 1
      raw,
      data: {
        categoryId: cat?.id ?? "",
        name,
        nameZh: r.nameZh ? String(r.nameZh).trim() : undefined,
        unit,
        defaultPricing: pricing,
        laborRate: labor,
        materialRate: material,
        notes: r.notes ? String(r.notes).trim() : undefined,
      },
    };
  });
}

function exportToExcel(rows: PriceItem[]) {
  const data = rows.map((r) => {
    const cat = CATEGORIES.find((c) => c.id === r.categoryId);
    return {
      "施工分类 / Trade": cat?.name ?? r.categoryId,
      "项目名称 EN": r.name,
      "项目名称 中文": r.nameZh ?? "",
      "单位 / Unit": r.unit,
      "默认报价方式 / Pricing": r.defaultPricing,
      "人工 / Labor": r.laborRate,
      "材料 / Material": r.materialRate,
      "合计 / Combined": (r.laborRate || 0) + (r.materialRate || 0),
      "备注 / Notes": r.notes ?? "",
    };
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Price Book");
  const d = new Date();
  const fname = `price_book_${d.toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}

// ---------------- Add Dialog ----------------

function AddDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (item: Omit<PriceItem, "id">) => void;
}) {
  const t = useT();
  const [form, setForm] = useState<Omit<PriceItem, "id">>({
    categoryId: CATEGORIES[0]?.id ?? "",
    name: "",
    nameZh: "",
    unit: "ea",
    defaultPricing: "Labor + Material",
    laborRate: 0,
    materialRate: 0,
    hoursPerUnit: 0,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        categoryId: CATEGORIES[0]?.id ?? "",
        name: "",
        nameZh: "",
        unit: "ea",
        defaultPricing: "Labor + Material",
        laborRate: 0,
        materialRate: 0,
        hoursPerUnit: 0,
        notes: "",
      });
    }
  }, [open]);

  const combined = (form.laborRate || 0) + (form.materialRate || 0);
  const canSave = form.name.trim() && form.unit.trim() && form.categoryId;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
   <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("pb.add.title")}</DialogTitle>
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
                setForm({ ...form, defaultPricing: e.target.value as PricingType })
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
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {t("common.cancel")}
          </button>
          <button
            disabled={!canSave}
            onClick={() => onSave(form)}
            className="inline-flex h-10 items-center justify-center rounded-[10px] bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            {t("common.save")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Import Preview Dialog ----------------

function ImportPreviewDialog({
  rows,
  onClose,
  onConfirm,
}: {
  rows: ImportRow[] | null;
  onClose: () => void;
  onConfirm: (rows: Array<ImportRow["data"]>) => void;
}) {
  const t = useT();
  if (!rows) {
    return (
      <Dialog open={false} onOpenChange={() => onClose()}>
        <DialogContent />
      </Dialog>
    );
  }
  const ok = rows.filter((r) => r.ok);
  const bad = rows.filter((r) => !r.ok);

  return (
    <Dialog open={!!rows} onOpenChange={(o) => !o && onClose()}>
   <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("pb.import.preview")}</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground">
          {t("pb.import.valid")}: <span className="font-semibold text-foreground">{ok.length}</span>
          {"  ·  "}
          {t("pb.import.invalid")}: <span className="font-semibold text-destructive">{bad.length}</span>
        </div>
        <div className="max-h-[420px] overflow-auto rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="bg-secondary/60 text-left">
              <tr>
                <th className="px-2 py-1.5">#</th>
                <th className="px-2 py-1.5">Trade</th>
                <th className="px-2 py-1.5">Item</th>
                <th className="px-2 py-1.5">Unit</th>
                <th className="px-2 py-1.5 text-right">Labor</th>
                <th className="px-2 py-1.5 text-right">Material</th>
                <th className="px-2 py-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.rowIndex} className="border-t border-border/60">
                  <td className="px-2 py-1 text-muted-foreground">{r.rowIndex}</td>
                  <td className="px-2 py-1">
                    {CATEGORIES.find((c) => c.id === r.data.categoryId)?.name ?? "-"}
                  </td>
                  <td className="px-2 py-1">{r.data.name}</td>
                  <td className="px-2 py-1 font-mono">{r.data.unit}</td>
                  <td className="px-2 py-1 text-right font-mono">{r.data.laborRate}</td>
                  <td className="px-2 py-1 text-right font-mono">{r.data.materialRate}</td>
                  <td className="px-2 py-1">
                    {r.ok ? (
                      <span className="text-emerald-600">OK</span>
                    ) : (
                      <span className="text-destructive">{r.error}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {t("common.cancel")}
          </button>
          <button
            disabled={ok.length === 0}
            onClick={() => onConfirm(ok.map((r) => r.data))}
            className="inline-flex h-10 items-center justify-center rounded-[10px] bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            {t("pb.import.confirm")} ({ok.length})
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

  useEffect(() => {
    setForm(item);
  }, [item]);

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
   <DialogContent size="md">
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
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
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
            className="inline-flex h-10 items-center justify-center rounded-[10px] bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            {t("common.save")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
