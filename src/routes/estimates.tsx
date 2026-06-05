import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Trash2, Download, ChevronRight, Tag } from "lucide-react";
import * as Icons from "lucide-react";
import { CATEGORIES, PRICE_ITEMS, PRICING_TYPES, SEED_CUSTOMERS, type PricingType } from "@/lib/data";
import { useEstimate, lineTotal, estimateTotals } from "@/lib/estimate-store";
import { jsPDF } from "jspdf";

export const Route = createFileRoute("/estimates")({
  head: () => ({
    meta: [
      { title: "Estimates · Construction Hub" },
      { name: "description", content: "Three-pane estimator: pick a trade, add line items, generate a PDF quote." },
    ],
  }),
  component: EstimatesPage,
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function EstimatesPage() {
  const [activeCat, setActiveCat] = useState(CATEGORIES[4].id); // Flooring
  const [itemQ, setItemQ] = useState("");
  const { meta, lines, addLine, updateLine, removeLine, setMeta } = useEstimate();

  const items = useMemo(
    () =>
      PRICE_ITEMS.filter((i) => i.categoryId === activeCat).filter((i) =>
        i.name.toLowerCase().includes(itemQ.toLowerCase()),
      ),
    [activeCat, itemQ],
  );

  const totals = estimateTotals(lines, meta.globalDiscount);

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div>
            <div className="font-display text-sm font-semibold">{meta.estimateNumber}</div>
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
            <option value="">— Select customer —</option>
            {SEED_CUSTOMERS.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.city}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => exportPDF(meta, lines, totals)}
          disabled={lines.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> Export PDF
        </button>
      </header>

      {/* Three panes */}
      <div className="flex flex-1 overflow-hidden">
        {/* Pane 1: Categories */}
        <div className="w-56 shrink-0 border-r border-border bg-panel/40 overflow-y-auto finder-scroll">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Trades</div>
          {CATEGORIES.map((c) => {
            const Icon = (Icons as any)[c.icon] ?? Tag;
            const active = activeCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors " +
                  (active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/85 hover:bg-secondary")
                }
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{c.name}</span>
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
                placeholder="Search items…"
                className="w-full rounded-md border border-input bg-card py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto finder-scroll">
            {items.map((it) => (
              <div key={it.id} className="group border-b border-border/60 p-3 hover:bg-secondary/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{it.name}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-mono">{it.unit}</span>
                      <span>{it.defaultPricing}</span>
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
                    title="Add to estimate"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No items.</div>
            )}
          </div>
        </div>

        {/* Pane 3: Estimate detail */}
        <div className="flex-1 flex flex-col bg-background min-w-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
            <div className="text-sm font-medium">
              Line Items <span className="ml-1 text-muted-foreground">({lines.length})</span>
            </div>
            {lines.length > 0 && (
              <button
                onClick={() => useEstimate.getState().clear()}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
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
                  <div className="font-display text-sm font-semibold">Empty estimate</div>
                  <div className="mt-1 text-xs text-muted-foreground">Pick a trade on the left, then add items from the middle pane.</div>
                </div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 border-b border-border bg-panel/80 text-left text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                  <tr>
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-2 py-2 font-medium">Pricing</th>
                    <th className="px-2 py-2 font-medium text-right">Qty</th>
                    <th className="px-2 py-2 font-medium">Unit</th>
                    <th className="px-2 py-2 font-medium text-right">Labor</th>
                    <th className="px-2 py-2 font-medium text-right">Material</th>
                    <th className="px-2 py-2 font-medium text-right">Disc.</th>
                    <th className="px-3 py-2 font-medium text-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b border-border/60 hover:bg-secondary/30">
                      <td className="px-3 py-2">
                        <div className="font-medium">{l.itemName}</div>
                        <div className="text-[11px] text-muted-foreground">{l.categoryName}</div>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={l.pricingType}
                          onChange={(e) => updateLine(l.id, { pricingType: e.target.value as PricingType })}
                          className="rounded border border-input bg-card px-1.5 py-1 text-xs outline-none"
                        >
                          {PRICING_TYPES.map((p) => <option key={p}>{p}</option>)}
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
                      <td className="px-2 py-2 font-mono text-xs text-muted-foreground">{l.unit}</td>
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
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-border bg-panel/60 px-5 py-4">
            <div className="ml-auto max-w-sm space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{fmt(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Line discounts</span>
                <span className="font-mono">− {fmt(totals.lineDiscounts)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Global discount</span>
                <input
                  type="number" min={0} step="1"
                  value={meta.globalDiscount}
                  onChange={(e) => setMeta({ globalDiscount: Number(e.target.value) })}
                  className="w-24 rounded border border-input bg-card px-2 py-1 text-right font-mono text-xs outline-none"
                />
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="font-display text-base font-semibold">Total</span>
                <span className="font-display text-2xl font-semibold tracking-tight">{fmt(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function exportPDF(meta: any, lines: any[], totals: ReturnType<typeof estimateTotals>) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Construction Hub", 48, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text("Contractor Estimate", 48, y + 16);
  doc.setTextColor(0);

  doc.setFontSize(10);
  doc.text(`Estimate: ${meta.estimateNumber}`, W - 48, y, { align: "right" });
  doc.text(`Date: ${meta.date}`, W - 48, y + 14, { align: "right" });

  y += 56;
  doc.setDrawColor(220); doc.line(48, y, W - 48, y); y += 20;

  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text("Bill To", 48, y);
  doc.setFont("helvetica", "normal");
  doc.text(meta.customerName || "—", 48, y + 16);
  doc.setTextColor(110);
  doc.text(meta.projectAddress || "", 48, y + 30);
  doc.setTextColor(0);
  y += 56;

  // Table header
  doc.setFillColor(245, 243, 238);
  doc.rect(48, y, W - 96, 22, "F");
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("Item", 56, y + 14);
  doc.text("Pricing", 260, y + 14);
  doc.text("Qty", 380, y + 14, { align: "right" });
  doc.text("Unit", 410, y + 14);
  doc.text("Total", W - 56, y + 14, { align: "right" });
  y += 30;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  lines.forEach((l) => {
    if (y > 720) { doc.addPage(); y = 56; }
    doc.text(l.itemName, 56, y);
    doc.setTextColor(120);
    doc.text(l.categoryName, 56, y + 11);
    doc.setTextColor(0);
    doc.text(l.pricingType, 260, y);
    doc.text(String(l.quantity), 380, y, { align: "right" });
    doc.text(l.unit, 410, y);
    doc.text(fmt(lineTotal(l)), W - 56, y, { align: "right" });
    y += 26;
  });

  y += 10;
  doc.setDrawColor(220); doc.line(W / 2, y, W - 48, y); y += 16;
  doc.setFontSize(10);
  doc.text("Subtotal", W / 2 + 20, y); doc.text(fmt(totals.subtotal), W - 56, y, { align: "right" }); y += 14;
  doc.text("Discounts", W / 2 + 20, y); doc.text("− " + fmt(totals.lineDiscounts + totals.globalDiscount), W - 56, y, { align: "right" }); y += 18;
  doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text("Total", W / 2 + 20, y); doc.text(fmt(totals.total), W - 56, y, { align: "right" });

  // Footer
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(140);
  doc.text("Quote valid for 30 days. Pricing subject to site verification.", 48, 760);
  doc.text("Customer signature: ____________________________   Date: __________", 48, 776);

  doc.save(`${meta.estimateNumber}.pdf`);
}
