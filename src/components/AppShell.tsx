import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  BarChart3,
  Settings,
  HardHat,
  Globe,
  LogOut,
  ChevronDown,
  UserCircle,
} from "lucide-react";
import { useLocaleStore, useLocale, useT } from "@/lib/i18n";
import { useCompany, useCompanyHydration } from "@/lib/company-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/reports", labelKey: "nav.reports", icon: BarChart3 },
  { to: "/estimates", labelKey: "nav.estimates", icon: FileText },
  { to: "/customers", labelKey: "nav.customers", icon: Users },
  { to: "/materials", labelKey: "nav.suppliers", icon: Package },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

export function LanguageToggle({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const setLocale = useLocaleStore((s) => s.setLocale);
  return (
    <div
      className={
        "inline-flex items-center gap-1 rounded-md border border-input bg-card px-1.5 py-1 text-xs " +
        className
      }
    >
      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
      <button
        onClick={() => setLocale("en")}
        className={
          "rounded px-2 py-0.5 transition-colors " +
          (locale === "en"
            ? "bg-primary text-primary-foreground font-medium"
            : "text-muted-foreground hover:text-foreground")
        }
      >
        🇺🇸 English
      </button>
      <span className="text-muted-foreground/50">|</span>
      <button
        onClick={() => setLocale("zh")}
        className={
          "rounded px-2 py-0.5 transition-colors " +
          (locale === "zh"
            ? "bg-primary text-primary-foreground font-medium"
            : "text-muted-foreground hover:text-foreground")
        }
      >
        🇨🇳 中文
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const t = useT();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
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
            <div className="text-[11px] text-muted-foreground">{t("app.subtitle")}</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-2 finder-scroll overflow-y-auto">
          {NAV.map((n) => {
            const active = path === n.to || path.startsWith(n.to + "/");
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
                <span>{t(n.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3 space-y-2">
          <LanguageToggle className="w-full justify-center" />
          {email && (
            <div className="rounded-md bg-card/60 px-3 py-2 text-[11px] text-muted-foreground">
              <div className="truncate font-medium text-foreground">{email}</div>
              <div>{t("app.workspaceMeta")}</div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-sidebar-border bg-card/40 px-3 py-1.5 text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("auth.logout")}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">{children}</main>
      
    </div>
  );
}
