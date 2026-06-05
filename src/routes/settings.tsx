import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Construction Hub" }] }),
  component: SettingsPage,
});

const FIELDS = [
  { label: "Company Name", value: "Bay Area Remodel Co." },
  { label: "License #", value: "CSLB 1042918" },
  { label: "Address", value: "1245 Industrial Way, Hayward, CA 94545" },
  { label: "Phone", value: "(510) 555-0100" },
  { label: "Email", value: "estimates@bayarearemodel.com" },
  { label: "Default Tax Rate", value: "9.25%" },
];

const ROLES = [
  { name: "Super Admin", desc: "Full access · price book · users · billing" },
  { name: "Estimator", desc: "Create / edit estimates · view price book" },
  { name: "Sales", desc: "View & send estimates · manage customers" },
  { name: "Viewer", desc: "Read-only access" },
];

function SettingsPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-8 py-5">
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Company profile, roles, and defaults.</p>
      </header>
      <div className="flex-1 overflow-y-auto finder-scroll p-8 space-y-6 max-w-3xl">
        <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <h2 className="mb-4 font-display text-base font-semibold">Company</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.label} className="block">
                <div className="mb-1 text-xs font-medium text-muted-foreground">{f.label}</div>
                <input
                  defaultValue={f.value}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <h2 className="mb-4 font-display text-base font-semibold">Roles & Permissions</h2>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <div key={r.name} className="flex items-center justify-between rounded-md border border-border/60 px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                </div>
                <button className="rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-secondary">Edit</button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <h2 className="mb-2 font-display text-base font-semibold">Roadmap</h2>
          <p className="mb-3 text-xs text-muted-foreground">Planned for upcoming releases.</p>
          <ul className="space-y-1.5 text-sm">
            <li className="flex gap-2"><span className="text-muted-foreground">V2</span> AI floor-plan area detection · Zillow import · Permit estimator · Google Maps lookup</li>
            <li className="flex gap-2"><span className="text-muted-foreground">V3</span> Mobile on-site quoting · customer e-signature · online payments · project management</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
