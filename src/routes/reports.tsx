import { createFileRoute } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/data";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · Construction Hub" }] }),
  component: ReportsPage,
});

const REVENUE_BY_TRADE = CATEGORIES.slice(0, 10).map((c, i) => ({
  name: c.name,
  amount: [42000, 31500, 28000, 24500, 22000, 18500, 15500, 12000, 9500, 7200][i],
}));

function fmt(n: number) { return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }); }

function ReportsPage() {
  const max = Math.max(...REVENUE_BY_TRADE.map((r) => r.amount));
  const total = REVENUE_BY_TRADE.reduce((s, r) => s + r.amount, 0);
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-8 py-5">
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Year-to-date revenue by trade.</p>
      </header>
      <div className="flex-1 overflow-y-auto finder-scroll p-8 space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">YTD Revenue</div>
              <div className="font-display text-4xl font-semibold tracking-tight">{fmt(total)}</div>
            </div>
            <div className="text-xs text-success">+18.4% vs last year</div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <h2 className="mb-4 font-display text-base font-semibold">Revenue by Trade</h2>
          <div className="space-y-3">
            {REVENUE_BY_TRADE.map((r) => (
              <div key={r.name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{r.name}</span>
                  <span className="font-mono text-muted-foreground">{fmt(r.amount)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary" style={{ width: `${(r.amount / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
