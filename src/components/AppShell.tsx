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
  const locale = useLocale();
  const isZh = locale === "zh";
  const [email, setEmail] = useState<string | null>(null);
  useCompanyHydration();
  const profile = useCompany((s) => s.profile);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success(isZh ? "已退出登录" : "Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const brandName = profile.name || "Construction Hub";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">

        <Link to="/dashboard" className="flex items-center gap-3 px-4 py-6">
          {profile.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt={brandName}
              className="h-12 w-12 rounded-xl object-contain bg-white ring-1 ring-sidebar-border p-1"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <HardHat className="h-6 w-6" />
            </div>
          )}
          <div className="leading-tight min-w-0">
            <div className="truncate font-display text-[16px] font-bold tracking-tight">{brandName}</div>
            <div className="text-[11px] text-muted-foreground">Professional Remodeling Contractor</div>
          </div>
        </Link>

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
          <LanguageToggle className="w-full justify-center h-10 text-[13px]" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-card/60 px-3 py-2 text-left transition-colors hover:bg-sidebar-accent"
                aria-label="user menu"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 leading-tight">
                  <div className="truncate text-[13px] font-semibold text-foreground">
                    {isZh ? "管理员" : "Admin"}
                  </div>
                  {email && (
                    <div className="truncate text-[11px] text-muted-foreground">{email}</div>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <DropdownMenuLabel>
                <div className="text-[13px] font-semibold">{isZh ? "管理员" : "Admin"}</div>
                {email && <div className="truncate text-[11px] font-normal text-muted-foreground">{email}</div>}
              </DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => navigate({ to: "/profile" })}>
                <UserCircle className="mr-2 h-4 w-4" />
                {isZh ? "我的资料" : "My Profile"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
                <Settings className="mr-2 h-4 w-4" />
                {isZh ? "系统设置" : "System Settings"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t("auth.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">{children}</main>
      
    </div>
  );
}
