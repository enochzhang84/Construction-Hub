import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Trash2, Download, ChevronRight, Tag, Save, Printer } from "lucide-react";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import { CATEGORIES, PRICE_ITEMS, PRICING_TYPES, SEED_CUSTOMERS, type PricingType } from "@/lib/data";
import { useEstimate, lineTotal, estimateTotals, type EstimateLine, type EstimateMeta } from "@/lib/estimate-store";
import { useT, useLocale, tCategory, tItem, tPricing, tUnit, type QuoteLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/estimates")({
  head: () => ({
    meta: [
      { title: "Estimates · Construction Hub" },
      { name: "description", content: "Three-pane estimator: pick a trade, add line items, generate a bilingual PDF quote." },
    ],
  }),
  component: EstimatesPage,
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function EstimatesPage() {
  const t = useT();
  const locale = useLocale();
  const [activeCat, setActiveCat] = useState(CATEGORIES[4].id); // Flooring
  const [itemQ, setItemQ] = useState("");
  const { meta, lines, addLine, updateLine, removeLine, setMeta } = useEstimate();

  const items = useMemo(() => {
    const needle = itemQ.toLowerCase();
    return PRICE_ITEMS.filter((i) => i.categoryId === activeCat).filter((i) =>
      (i.name + " " + (i.nameZh ?? "")).toLowerCase().includes(needle),
    );
  }, [activeCat, itemQ]);

  const totals = estimateTotals(lines, meta.globalDiscount);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div>
            <div className="font-display text-sm font-semibold" suppressHydrationWarning>{meta.estimateNumber}</div>
            <div className="text-[11px] text-muted-foreground">{meta.date}</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <select
            value={meta.customerId ?? ""}
            onChange={(e) => {
              const c = SEED_CUSTOMERS.find((x) => x.id === e.target.value);
              setMeta({
                customerId: c?.id ?? null,
                customerName: c?.name ?? "",
                projectAddress: c ? `${c.address}, ${c.city}, ${c.state} ${c.zip}` : "",
              });
            }}
            className="rounded-md border border-input bg-card px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="">{t("est.selectCustomer")}</option>
            {SEED_CUSTOMERS.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.city}</option>
            ))}
          </select>

          <div className="h-8 w-px bg-border" />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("est.quoteLanguage")}:</span>
            <select
              value={meta.quoteLanguage}
              onChange={(e) => setMeta({ quoteLanguage: e.target.value as QuoteLanguage })}
              className="rounded-md border border-input bg-card px-2 py-1 text-xs outline-none"
            >
              <option value="en">{t("est.lang.en")}</option>
              <option value="zh">{t("est.lang.zh")}</option>
              <option value="bilingual">{t("est.lang.bilingual")}</option>
            </select>
          </label>
        </div>
        <button
          onClick={() => exportPDF(meta, lines, totals)}
          disabled={lines.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> {t("est.exportPDF")}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Pane 1: Categories */}
        <div className="w-56 shrink-0 border-r border-border bg-panel/40 overflow-y-auto finder-scroll">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("est.trades")}</div>
          {CATEGORIES.map((c) => {
            const Icon = (Icons as any)[c.icon] ?? Tag;
            const active = activeCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors " +
                  (active ? "bg-primary text-primary-foreground" : "text-foreground/85 hover:bg-secondary")
                }
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{tCategory(c, locale)}</span>
                <ChevronRight className={"h-3 w-3 " + (active ? "opacity-100" : "opacity-30")} />
              </button>
            );
          })}
        </div>

        {/* Pane 2: Items */}
        <div className="w-[340px] shrink-0 border-r border-border bg-panel/20 flex flex-col">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={itemQ}
                onChange={(e) => setItemQ(e.target.value)}
                placeholder={t("est.searchItems")}
                className="w-full rounded-md border border-input bg-card py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto finder-scroll">
            {items.map((it) => (
              <div key={it.id} className="group border-b border-border/60 p-3 hover:bg-secondary/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{tItem(it, locale)}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-mono">{tUnit(it.unit, locale)}</span>
                      <span>{tPricing(it.defaultPricing, locale)}</span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      L {fmt(it.laborRate)} · M {fmt(it.materialRate)} /{it.unit}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const cat = CATEGORIES.find((c) => c.id === it.categoryId)!;
                      addLine({
                        categoryId: cat.id,
                        categoryName: cat.name,
                        itemId: it.id,
                        itemName: it.name,
                        unit: it.unit,
                        pricingType: it.defaultPricing,
                        quantity: 1,
                        hoursPerUnit: it.hoursPerUnit,
                        laborRate: it.laborRate,
                        materialRate: it.materialRate,
                        discount: 0,
                      });
                    }}
                    className="rounded-md bg-primary p-1.5 text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    title={t("est.addToEstimate")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">{t("est.noItems")}</div>
            )}
          </div>
        </div>

        {/* Pane 3: Estimate detail */}
        <div className="flex-1 flex flex-col bg-background min-w-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
            <div className="text-sm font-medium">
              {t("est.lineItems")} <span className="ml-1 text-muted-foreground">({lines.length})</span>
            </div>
            {lines.length > 0 && (
              <button
                onClick={() => useEstimate.getState().clear()}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                {t("est.clearAll")}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto finder-scroll">
            {lines.length === 0 ? (
              <div className="flex h-full items-center justify-center p-10 text-center">
                <div>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="font-display text-sm font-semibold">{t("est.empty")}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{t("est.emptyHint")}</div>
                </div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 border-b border-border bg-panel/80 text-left text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t("est.col.item")}</th>
                    <th className="px-2 py-2 font-medium">{t("est.col.pricing")}</th>
                    <th className="px-2 py-2 font-medium text-right">{t("est.col.qty")}</th>
                    <th className="px-2 py-2 font-medium">{t("est.col.unit")}</th>
                    <th className="px-2 py-2 font-medium text-right">{t("est.col.labor")}</th>
                    <th className="px-2 py-2 font-medium text-right">{t("est.col.material")}</th>
                    <th className="px-2 py-2 font-medium text-right">{t("est.col.disc")}</th>
                    <th className="px-3 py-2 font-medium text-right">{t("est.col.total")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => {
                    const cat = CATEGORIES.find((c) => c.id === l.categoryId);
                    const item = PRICE_ITEMS.find((p) => p.id === l.itemId);
                    return (
                      <tr key={l.id} className="border-b border-border/60 hover:bg-secondary/30">
                        <td className="px-3 py-2">
                          <div className="font-medium">{item ? tItem(item, locale) : l.itemName}</div>
                          <div className="text-[11px] text-muted-foreground">{cat ? tCategory(cat, locale) : l.categoryName}</div>
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={l.pricingType}
                            onChange={(e) => updateLine(l.id, { pricingType: e.target.value as PricingType })}
                            className="rounded border border-input bg-card px-1.5 py-1 text-xs outline-none"
                          >
                            {PRICING_TYPES.map((p) => (
                              <option key={p} value={p}>{tPricing(p, locale)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number" min={0} step="0.01"
                            value={l.quantity}
                            onChange={(e) => updateLine(l.id, { quantity: Number(e.target.value) })}
                            className="w-20 rounded border border-input bg-card px-2 py-1 text-right text-xs outline-none"
                          />
                        </td>
                        <td className="px-2 py-2 font-mono text-xs text-muted-foreground">{tUnit(l.unit, locale)}</td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number" min={0} step="0.01"
                            value={l.laborRate}
                            onChange={(e) => updateLine(l.id, { laborRate: Number(e.target.value) })}
                            className="w-20 rounded border border-input bg-card px-2 py-1 text-right text-xs outline-none"
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number" min={0} step="0.01"
                            value={l.materialRate}
                            onChange={(e) => updateLine(l.id, { materialRate: Number(e.target.value) })}
                            className="w-20 rounded border border-input bg-card px-2 py-1 text-right text-xs outline-none"
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number" min={0} step="0.01"
                            value={l.discount}
                            onChange={(e) => updateLine(l.id, { discount: Number(e.target.value) })}
                            className="w-20 rounded border border-input bg-card px-2 py-1 text-right text-xs outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-medium">{fmt(lineTotal(l))}</td>
                        <td className="px-2 py-2">
                          <button onClick={() => removeLine(l.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="border-t border-border bg-panel/60 px-5 py-4">
            <div className="ml-auto max-w-sm space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("est.subtotal")}</span>
                <span className="font-mono">{fmt(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("est.lineDiscounts")}</span>
                <span className="font-mono">− {fmt(totals.lineDiscounts)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{t("est.globalDiscount")}</span>
                <input
                  type="number" min={0} step="1"
                  value={meta.globalDiscount}
                  onChange={(e) => setMeta({ globalDiscount: Number(e.target.value) })}
                  className="w-24 rounded border border-input bg-card px-2 py-1 text-right font-mono text-xs outline-none"
                />
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="font-display text-base font-semibold">{t("est.total")}</span>
                <span className="font-display text-2xl font-semibold tracking-tight">{fmt(totals.total)}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => {
                  // Zustand persist auto-saves on every change; this is an explicit confirm.
                  useEstimate.setState((s) => ({ ...s }));
                  toast.success(locale === "zh" ? "保存成功" : "Saved successfully");
                }}
                disabled={lines.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3.5 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-40"
              >
                <Save className="h-4 w-4" /> {t("common.save")}
              </button>
              <button
                onClick={() => window.print()}
                disabled={lines.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3.5 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-40"
              >
                <Printer className="h-4 w-4" /> {locale === "zh" ? "打印报价" : "Print Estimate"}
              </button>
              <button
                onClick={() => exportPDF(meta, lines, totals)}
                disabled={lines.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                <Download className="h-4 w-4" /> {t("est.exportPDF")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------- Bilingual / multilingual PDF via print window (handles CJK natively) --------

interface PDFLabels {
  brand: string;
  subtitle: string;
  estimate: string;
  date: string;
  billTo: string;
  item: string;
  pricing: string;
  qty: string;
  unit: string;
  total: string;
  subtotal: string;
  discounts: string;
  totalRow: string;
  footer: string;
  signature: string;
}

const LABELS_EN: PDFLabels = {
  brand: "Construction Hub",
  subtitle: "Contractor Estimate",
  estimate: "Estimate",
  date: "Date",
  billTo: "Bill To",
  item: "Item",
  pricing: "Pricing",
  qty: "Qty",
  unit: "Unit",
  total: "Total",
  subtotal: "Subtotal",
  discounts: "Discounts",
  totalRow: "Total",
  footer: "Quote valid for 30 days. Pricing subject to site verification.",
  signature: "Customer signature: ____________________________   Date: __________",
};
const LABELS_ZH: PDFLabels = {
  brand: "Construction Hub",
  subtitle: "装修报价单",
  estimate: "报价编号",
  date: "日期",
  billTo: "客户",
  item: "项目",
  pricing: "报价方式",
  qty: "数量",
  unit: "单位",
  total: "小计",
  subtotal: "小计",
  discounts: "折扣合计",
  totalRow: "总计",
  footer: "报价 30 天内有效，最终价格以现场核对为准。",
  signature: "客户签字：____________________________   日期：__________",
};

function bi(en: string, zh: string, mode: QuoteLanguage): string {
  if (mode === "en") return en;
  if (mode === "zh") return zh;
  return `${en}<br/><span class="zh">${zh}</span>`;
}

function exportPDF(meta: EstimateMeta, lines: EstimateLine[], totals: ReturnType<typeof estimateTotals>) {
  const mode = meta.quoteLanguage;
  const L = mode === "zh" ? LABELS_ZH : LABELS_EN;
  const LZ = LABELS_ZH;

  const lineRows = lines
    .map((l) => {
      const cat = CATEGORIES.find((c) => c.id === l.categoryId);
      const item = PRICE_ITEMS.find((p) => p.id === l.itemId);
      const nameEn = item?.name ?? l.itemName;
      const nameZh = item?.nameZh ?? nameEn;
      const catEn = cat?.name ?? l.categoryName;
      const catZh = cat?.nameZh ?? catEn;
      const pricingEn = l.pricingType;
      const pricingZh = tPricing(l.pricingType, "zh");
      const unitEn = l.unit;
      const unitZh = tUnit(l.unit, "zh");
      return `
        <tr>
          <td>
            <div class="strong">${bi(nameEn, nameZh, mode)}</div>
            <div class="muted small">${bi(catEn, catZh, mode)}</div>
          </td>
          <td>${bi(pricingEn, pricingZh, mode)}</td>
          <td class="right mono">${l.quantity}</td>
          <td class="mono">${bi(unitEn, unitZh, mode)}</td>
          <td class="right mono">${fmt(lineTotal(l))}</td>
        </tr>`;
    })
    .join("");

  const titleHeader =
    mode === "bilingual"
      ? `${L.subtitle} / ${LZ.subtitle}`
      : L.subtitle;

  const html = `<!doctype html>
<html lang="${mode === "zh" ? "zh-CN" : "en"}">
<head>
<meta charset="utf-8" />
<title>${meta.estimateNumber} — ${L.brand}</title>
<style>
  @page { size: letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body {
    font-family: "Helvetica Neue", "Inter", "PingFang SC", "Hiragino Sans GB",
      "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", Arial, sans-serif;
    color: #1a1a1a; margin: 0; padding: 28px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid #ddd; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
  .sub { font-size: 11px; color: #777; margin-top: 4px; }
  .meta { font-size: 11px; text-align: right; line-height: 1.6; }
  .billto { margin: 22px 0; font-size: 12px; }
  .billto .label { font-weight: 700; margin-bottom: 4px; }
  .muted { color: #777; }
  .small { font-size: 10px; }
  .zh { color: #555; font-size: 0.92em; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead th { background: #f5f3ee; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #ddd; }
  tbody td { padding: 10px; border-bottom: 1px solid #eee; font-size: 11.5px; vertical-align: top; }
  td.right, th.right { text-align: right; }
  .mono { font-family: "JetBrains Mono", "SF Mono", Menlo, monospace; }
  .strong { font-weight: 600; }
  .totals { margin-top: 16px; margin-left: auto; width: 280px; font-size: 12px; }
  .totals .row { display: flex; justify-content: space-between; padding: 4px 0; color: #555; }
  .totals .grand { display: flex; justify-content: space-between; padding: 8px 0 0; border-top: 1px solid #ccc; margin-top: 6px; font-size: 16px; font-weight: 700; color: #111; }
  .footer { margin-top: 36px; font-size: 9.5px; color: #999; }
  .footer .sig { margin-top: 8px; color: #555; }
  @media print { .noprint { display: none !important; } }
  .bar { position: fixed; top: 10px; right: 10px; }
  .bar button { font-size: 12px; padding: 6px 12px; cursor: pointer; }
</style>
</head>
<body>
  <div class="bar noprint">
    <button onclick="window.print()">${mode === "zh" ? "打印 / 另存为 PDF" : "Print / Save as PDF"}</button>
  </div>

  <div class="head">
    <div>
      <div class="brand">${L.brand}</div>
      <div class="sub">${titleHeader}</div>
    </div>
    <div class="meta">
      <div><strong>${bi(LABELS_EN.estimate, LZ.estimate, mode)}:</strong> ${meta.estimateNumber}</div>
      <div><strong>${bi(LABELS_EN.date, LZ.date, mode)}:</strong> ${meta.date}</div>
    </div>
  </div>

  <div class="billto">
    <div class="label">${bi(LABELS_EN.billTo, LZ.billTo, mode)}</div>
    <div class="strong">${meta.customerName || "—"}</div>
    <div class="muted">${meta.projectAddress || ""}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${bi(LABELS_EN.item, LZ.item, mode)}</th>
        <th>${bi(LABELS_EN.pricing, LZ.pricing, mode)}</th>
        <th class="right">${bi(LABELS_EN.qty, LZ.qty, mode)}</th>
        <th>${bi(LABELS_EN.unit, LZ.unit, mode)}</th>
        <th class="right">${bi(LABELS_EN.total, LZ.total, mode)}</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>${bi(LABELS_EN.subtotal, LZ.subtotal, mode)}</span><span class="mono">${fmt(totals.subtotal)}</span></div>
    <div class="row"><span>${bi(LABELS_EN.discounts, LZ.discounts, mode)}</span><span class="mono">− ${fmt(totals.lineDiscounts + totals.globalDiscount)}</span></div>
    <div class="grand"><span>${bi(LABELS_EN.totalRow, LZ.totalRow, mode)}</span><span class="mono">${fmt(totals.total)}</span></div>
  </div>

  <div class="footer">
    <div>${bi(LABELS_EN.footer, LZ.footer, mode)}</div>
    <div class="sig">${bi(LABELS_EN.signature, LZ.signature, mode)}</div>
  </div>

  <script>
    window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 350); });
  </script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) {
    alert("Please allow pop-ups to export the PDF.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
