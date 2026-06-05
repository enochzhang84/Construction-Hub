import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  Package,
  BarChart3,
  Settings,
  HardHat,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/estimates", label: "Estimates", icon: FileText },
  { to: "/price-book", label: "Price Book", icon: BookOpen },
  { to: "/materials", label: "Materials", icon: Package },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        {/* Traffic-light dots (Finder vibe) */}
        <div className="flex items-center gap-1.5 px-4 pt-4">
          <span className="h-3 w-3 rounded-full bg-[oklch(0.72_0.18_28)]" />
          <span className="h-3 w-3 rounded-full bg-[oklch(0.82_0.16_85)]" />
          <span className="h-3 w-3 rounded-full bg-[oklch(0.72_0.16_150)]" />
        </div>

        <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <HardHat className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[15px] font-semibold">Construction Hub</div>
            <div className="text-[11px] text-muted-foreground">Estimating · v1</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-2 finder-scroll overflow-y-auto">
          {NAV.map((n) => {
            const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors " +
                  (active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-md bg-card/60 px-3 py-2 text-[11px] text-muted-foreground">
            <div className="font-medium text-foreground">Demo workspace</div>
            <div>California · Local data only</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
