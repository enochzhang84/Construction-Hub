import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES, PRICE_ITEMS } from "@/lib/data";
import { useT, useLocale, tCategory, tItem, tPricing, tUnit } from "@/lib/i18n";

export const Route = createFileRoute("/price-book")({
  head: () => ({ meta: [{ title: "Price Book · Construction Hub" }] }),
  component: PriceBookPage,
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function PriceBookPage() {
  const t = useT();
  const locale = useLocale();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    return PRICE_ITEMS.filter((i) =>
      (i.name + " " + (i.nameZh ?? "")).toLowerCase().includes(needle),
    ).map((i) => ({
      ...i,
      cat: CATEGORIES.find((c) => c.id === i.categoryId)!,
    }));
  }, [q]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-8 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("pb.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} {t("pb.items")} {CATEGORIES.length} {t("pb.trades")}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("est.searchItems")}
            className="w-72 rounded-md border border-input bg-card py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto finder-scroll p-8">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-panel">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("pb.col.trade")}</th>
                <th className="px-4 py-2.5 font-medium">{t("pb.col.item")}</th>
                <th className="px-4 py-2.5 font-medium">{t("pb.col.unit")}</th>
                <th className="px-4 py-2.5 font-medium">{t("pb.col.defaultPricing")}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t("pb.col.labor")}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t("pb.col.material")}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t("pb.col.combined")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-2.5 text-muted-foreground">{tCategory(r.cat, locale)}</td>
                  <td className="px-4 py-2.5 font-medium">{tItem(r, locale)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{tUnit(r.unit, locale)}</td>
                  <td className="px-4 py-2.5 text-xs">{tPricing(r.defaultPricing, locale)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{fmt(r.laborRate)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{fmt(r.materialRate)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold">{fmt(r.laborRate + r.materialRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
