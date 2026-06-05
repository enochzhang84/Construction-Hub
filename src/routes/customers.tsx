import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus, Mail, Phone, MapPin } from "lucide-react";
import { SEED_CUSTOMERS } from "@/lib/data";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers · Construction Hub" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const t = useT();
  const [q, setQ] = useState("");
  const filtered = SEED_CUSTOMERS.filter((c) =>
    [c.name, c.email, c.address, c.city].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-8 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("cust.title")}</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} {t("cust.contacts")}</p>
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
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> {t("cust.new")}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto finder-scroll p-8">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-5 shadow-panel transition-shadow hover:shadow-soft">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-base font-semibold">{c.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{t("cust.added")} {c.createdAt}</div>
                </div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{c.state}</span>
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /><span className="font-mono text-xs">{c.phone}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /><span className="text-xs">{c.email}</span></div>
                <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5 mt-0.5" /><span className="text-xs">{c.address}, {c.city}, {c.state} {c.zip}</span></div>
              </div>
              {c.notes && (
                <p className="mt-3 border-t border-border/60 pt-3 text-xs italic text-muted-foreground">"{c.notes}"</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
