import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/materials")({
  head: () => ({ meta: [{ title: "Materials · Construction Hub" }] }),
  component: MaterialsPage,
});

const SUPPLIERS = [
  { name: "Home Depot Pro", categoryEn: "General", categoryZh: "综合", account: "HD-PRO-8842", termsEn: "Net 30", termsZh: "月结 30 天" },
  { name: "Floor & Decor", categoryEn: "Flooring & Tile", categoryZh: "地板与瓷砖", account: "FD-2210", termsEn: "COD", termsZh: "货到付款" },
  { name: "Ferguson", categoryEn: "Plumbing", categoryZh: "水暖", account: "FRG-9921", termsEn: "Net 30", termsZh: "月结 30 天" },
  { name: "Rexel", categoryEn: "Electrical", categoryZh: "电气", account: "RX-4451", termsEn: "Net 30", termsZh: "月结 30 天" },
  { name: "Dunn-Edwards", categoryEn: "Paint", categoryZh: "油漆", account: "DE-PRO-115", termsEn: "Net 15", termsZh: "月结 15 天" },
];

function MaterialsPage() {
  const t = useT();
  const locale = useLocale();
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-8 py-5">
        <h1 className="font-display text-2xl font-semibold">{t("mat.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("mat.subtitle")}</p>
      </header>
      <div className="flex-1 overflow-y-auto finder-scroll p-8">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SUPPLIERS.map((s) => (
            <div key={s.name} className="rounded-lg border border-border bg-card p-5 shadow-panel">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-base font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{locale === "zh" ? s.categoryZh : s.categoryEn}</div>
                </div>
                <div className="rounded-md bg-secondary p-2"><Package className="h-4 w-4" /></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">{t("mat.account")}</div>
                  <div className="font-mono">{s.account}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t("mat.terms")}</div>
                  <div>{locale === "zh" ? s.termsZh : s.termsEn}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
