import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";

export const Route = createFileRoute("/materials")({
  head: () => ({ meta: [{ title: "Materials · Construction Hub" }] }),
  component: MaterialsPage,
});

const SUPPLIERS = [
  { name: "Home Depot Pro", category: "General", account: "HD-PRO-8842", terms: "Net 30" },
  { name: "Floor & Decor", category: "Flooring & Tile", account: "FD-2210", terms: "COD" },
  { name: "Ferguson", category: "Plumbing", account: "FRG-9921", terms: "Net 30" },
  { name: "Rexel", category: "Electrical", account: "RX-4451", terms: "Net 30" },
  { name: "Dunn-Edwards", category: "Paint", account: "DE-PRO-115", terms: "Net 15" },
];

export default function noop() {}

function MaterialsPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-8 py-5">
        <h1 className="font-display text-2xl font-semibold">Materials & Suppliers</h1>
        <p className="text-sm text-muted-foreground">Vendor accounts and material cost references.</p>
      </header>
      <div className="flex-1 overflow-y-auto finder-scroll p-8">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SUPPLIERS.map((s) => (
            <div key={s.name} className="rounded-lg border border-border bg-card p-5 shadow-panel">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-base font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.category}</div>
                </div>
                <div className="rounded-md bg-secondary p-2"><Package className="h-4 w-4" /></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Account</div>
                  <div className="font-mono">{s.account}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Terms</div>
                  <div>{s.terms}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
