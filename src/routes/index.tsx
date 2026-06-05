import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HardHat, Phone, Mail, MapPin, BadgeCheck, Globe2, ArrowRight } from "lucide-react";
import { useCompany } from "@/lib/company-store";
import { useLocale, useLocaleStore } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contractor Estimating System — Home" },
      {
        name: "description",
        content:
          "Official site for our contractor estimating system. Manage customers, estimates, projects and payments.",
      },
    ],
  }),
  component: PublicHome,
});

function PublicHome() {
  const profile = useCompany((s) => s.profile);
  const locale = useLocale();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const isZh = locale === "zh";

  const companyName =
    profile.name || (isZh ? "您的装修公司" : "Your Contracting Company");
  const description = isZh
    ? "我们是一家专注于住宅与商业装修的专业承包商，提供报价、施工管理与售后服务一体化解决方案。"
    : "We are a licensed remodeling contractor providing residential and commercial construction, project management, and after-service support.";
  const services = isZh
    ? ["厨房翻新", "卫浴改造", "全屋装修", "地板与油漆", "ADU 与车库改建"]
    : ["Kitchen Remodeling", "Bathroom Remodeling", "Whole-House Renovation", "Flooring & Paint", "ADU & Garage Conversion"];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-secondary/40 via-background to-background text-foreground">
      {/* Top Nav */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={companyName}
                className="h-9 w-9 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <HardHat className="h-5 w-5" />
              </div>
            )}
            <div className="font-display text-base font-semibold">{companyName}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1 rounded-md border border-input bg-card px-1.5 py-1 text-xs sm:inline-flex">
              <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                onClick={() => setLocale("en")}
                className={
                  "rounded px-2 py-0.5 transition-colors " +
                  (locale === "en"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                English
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
                中文
              </button>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {isZh ? "登录" : "Login"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero / Body */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          {/* Company info */}
          <section className="space-y-8">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isZh ? "持牌承包商" : "Licensed Contractor"}
              </div>
              <h1 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">
                {companyName}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {isZh ? "服务范围" : "Services"}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {services.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border bg-card px-3 py-1 text-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label={isZh ? "电话" : "Phone"}
                value={profile.phone || (isZh ? "未填写" : "Not provided")}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={profile.email || (isZh ? "未填写" : "Not provided")}
              />
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label={isZh ? "地址" : "Address"}
                value={profile.address || (isZh ? "未填写" : "Not provided")}
              />
              <InfoRow
                icon={<BadgeCheck className="h-4 w-4" />}
                label={isZh ? "执照编号" : "License No."}
                value={profile.license || (isZh ? "未填写" : "Not provided")}
              />
              {profile.website && (
                <InfoRow
                  icon={<Globe2 className="h-4 w-4" />}
                  label={isZh ? "网站" : "Website"}
                  value={profile.website}
                />
              )}
            </div>
          </section>

          {/* Login card */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HardHat className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">
                Contractor Estimating System
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {isZh
                  ? "请登录进入报价管理系统，管理客户、报价单、施工项目和付款记录。"
                  : "Manage customers, estimates, projects and payments. Sign in to enter the dashboard."}
              </p>
              <Link
                to="/dashboard"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {isZh ? "登录后台" : "Login to Dashboard"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="mt-4 text-center text-[11px] text-muted-foreground">
                {isZh ? "内部员工专用入口" : "Internal staff access only"}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border/60 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 text-xs text-muted-foreground sm:flex-row">
          <div>
            © {new Date().getFullYear()} {companyName}.{" "}
            {isZh ? "保留所有权利。" : "All rights reserved."}
          </div>
          <div>Powered by Contractor Estimating System</div>
        </div>
      </footer>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
