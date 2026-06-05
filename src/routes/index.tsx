import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, DollarSign, Send, CheckCircle2, Clock, Users, ArrowUpRight } from "lucide-react";
import { SEED_CUSTOMERS } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Construction Hub" },
      { name: "description", content: "Monthly estimate metrics, pipeline, and recent customers." },
    ],
  }),
  component: Dashboard,
});

const STATS = [
  { label: "Estimates This Month", value: "27", delta: "+12%", icon: FileText },
  { label: "Closed Revenue", value: "$184,250", delta: "+8.4%", icon: DollarSign },
  { label: "Awaiting Send", value: "6", delta: "Action needed", icon: Clock, warn: true },
  { label: "Sent / Pending", value: "11", delta: "Avg 3.2 days", icon: Send },
  { label: "Closed Projects", value: "9", delta: "+2 vs last mo.", icon: CheckCircle2 },
  { label: "Active Customers", value: "48", delta: "+5 new", icon: Users },
];

function Dashboard() {
  return (
    <div className="h-full overflow-y-auto finder-scroll">
      <header className="flex items-center justify-between border-b border-border bg-background/80 px-8 py-5 backdrop-blur">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview · {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        </div>
        <Link
          to="/estimates"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          New Estimate <ArrowUpRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="space-y-8 p-8">
        {/* Stats grid */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-lg border border-border bg-card p-5 shadow-panel">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</div>
                    <div className="mt-2 font-display text-3xl font-semibold tracking-tight">{s.value}</div>
                  </div>
                  <div className="rounded-md bg-secondary p-2"><Icon className="h-4 w-4" /></div>
                </div>
                <div className={"mt-3 text-xs " + (s.warn ? "text-warning" : "text-muted-foreground")}>{s.delta}</div>
              </div>
            );
          })}
        </section>

        {/* Recent customers */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent Customers</h2>
            <Link to="/customers" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-panel">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Project Address</th>
                  <th className="px-4 py-2.5 font-medium">Phone</th>
                  <th className="px-4 py-2.5 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {SEED_CUSTOMERS.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.address}, {c.city}, {c.state}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
