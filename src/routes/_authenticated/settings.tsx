import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { useCompany, useCompanyHydration, type CompanyProfile } from "@/lib/company-store";
import { useTerms, DEFAULT_TERMS_EN, DEFAULT_TERMS_ZH } from "@/lib/terms-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, ChevronRight, FileText, RotateCcw, UserCircle2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · Construction Hub" }] }),
  component: SettingsPage,
});

function Field({
  label,
  field,
  placeholder,
  type = "text",
}: {
  label: string;
  field: keyof CompanyProfile;
  placeholder?: string;
  type?: string;
}) {
  const value = useCompany((s) => s.profile[field]);
  const setProfile = useCompany((s) => s.setProfile);
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setProfile({ [field]: e.target.value } as Partial<CompanyProfile>)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}

function SettingsPage() {
  const t = useT();
  const profile = useCompany((s) => s.profile);
  useCompanyHydration();


  const ROLES = [
    { name: t("set.role.admin"), desc: t("set.role.admin.desc") },
    { name: t("set.role.estimator"), desc: t("set.role.estimator.desc") },
    { name: t("set.role.sales"), desc: t("set.role.sales.desc") },
    { name: t("set.role.viewer"), desc: t("set.role.viewer.desc") },
  ];

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-8 py-5">
        <h1 className="font-display text-2xl font-semibold">{t("set.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("set.subtitle")}</p>
      </header>
      <div className="flex-1 overflow-y-auto finder-scroll p-8 space-y-6 max-w-3xl">
        <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <h2 className="mb-1 font-display text-base font-semibold">Company Profile</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Shown on estimates, printouts, and PDFs sent to your customers.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company Name" field="name" placeholder="Your Company Name" />
            <Field label="License Number" field="license" placeholder="CSLB 0000000" />
            <Field label="Phone" field="phone" placeholder="(510) 555-0100" />
            <Field label="Email" field="email" type="email" placeholder="info@company.com" />
            <div className="sm:col-span-2">
              <Field label="Address" field="address" placeholder="Street, City, State ZIP" />
            </div>
            <Field label="Website" field="website" placeholder="www.company.com" />
            <Field label="Logo URL" field="logoUrl" placeholder="https://…/logo.png" />
            <Field label="Default Tax Rate (%)" field="taxRate" type="number" placeholder="0" />
          </div>
          {profile.logoUrl && (
            <div className="mt-4 flex items-center gap-3 rounded-md border border-dashed border-border bg-secondary/30 p-3">
              <img src={profile.logoUrl} alt="Logo preview" className="h-12 w-12 rounded object-contain" />
              <span className="text-xs text-muted-foreground">Logo preview</span>
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => toast.success("Company profile saved")}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Save Changes
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <h2 className="mb-4 font-display text-base font-semibold">{t("set.roles")}</h2>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <div key={r.name} className="flex items-center justify-between rounded-md border border-border/60 px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                </div>
                <button className="rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-secondary">{t("set.edit")}</button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <h2 className="mb-1 font-display text-base font-semibold">{t("set.constructionItems")}</h2>
          <p className="mb-4 text-xs text-muted-foreground">{t("set.constructionItems.desc")}</p>
          <Link
            to="/price-book"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>{t("set.manageConstructionItems")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>

        <TermsSection />

        <UsersAndRolesSection />


        <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <h2 className="mb-2 font-display text-base font-semibold">{t("set.roadmap")}</h2>
          <p className="mb-3 text-xs text-muted-foreground">{t("set.roadmapHint")}</p>
          <ul className="space-y-1.5 text-sm">
            <li className="flex gap-2"><span className="text-muted-foreground">V2</span> AI floor-plan area detection · Zillow import · Permit estimator · Google Maps lookup</li>
            <li className="flex gap-2"><span className="text-muted-foreground">V3</span> Mobile on-site quoting · customer e-signature · online payments · project management</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

type RoleKey = "super_admin" | "admin" | "estimator" | "sales" | "viewer";

const ROLE_META: Record<
  RoleKey,
  { en: string; zh: string; tone: string }
> = {
  super_admin: { en: "Super Admin", zh: "超级管理员", tone: "bg-primary/15 text-primary border-primary/30" },
  admin: { en: "Admin", zh: "管理员", tone: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  estimator: { en: "Estimator", zh: "报价员", tone: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  sales: { en: "Sales", zh: "销售", tone: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  viewer: { en: "Viewer", zh: "只读", tone: "bg-muted text-muted-foreground border-border" },
};

function UsersAndRolesSection() {
  const locale = useLocale();
  const isZh = locale === "zh";
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleKey[]>([]);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user || cancelled) {
        setLoading(false);
        return;
      }
      setEmail(user.email ?? null);
      setUserId(user.id);
      setCreatedAt(user.created_at ?? null);

      const [{ data: profile }, { data: roleRows }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      setDisplayName(
        profile?.display_name ??
          (user.user_metadata?.display_name as string | undefined) ??
          (user.email ? user.email.split("@")[0] : null),
      );
      setRoles(((roleRows ?? []).map((r) => r.role) as RoleKey[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryRole: RoleKey = roles.includes("super_admin")
    ? "super_admin"
    : roles.includes("admin")
      ? "admin"
      : roles[0] ?? "viewer";

  const ROLE_DESCRIPTIONS: { role: RoleKey; perms: { en: string; zh: string }[] }[] = [
    {
      role: "super_admin",
      perms: [
        { en: "Full access to all data and settings", zh: "可访问全部数据与系统设置" },
        { en: "Manage users and roles", zh: "管理用户与角色权限" },
        { en: "Edit company profile, price book, terms", zh: "编辑公司资料、价格库、条款" },
      ],
    },
    {
      role: "admin",
      perms: [
        { en: "Manage customers, estimates, projects", zh: "管理客户、报价单、施工项目" },
        { en: "Edit price book and templates", zh: "编辑价格库与模板" },
        { en: "Cannot manage users or roles", zh: "不能管理用户与角色" },
      ],
    },
    {
      role: "estimator",
      perms: [
        { en: "Create and edit estimates", zh: "创建与编辑报价单" },
        { en: "Read price book and customers", zh: "查看价格库与客户资料" },
        { en: "Cannot edit company / system settings", zh: "不能修改公司资料与系统设置" },
      ],
    },
    {
      role: "sales",
      perms: [
        { en: "Manage customers and leads", zh: "管理客户与意向单" },
        { en: "Create estimates from price book", zh: "基于价格库创建报价" },
        { en: "Read-only on completed projects", zh: "对已完成项目只读" },
      ],
    },
    {
      role: "viewer",
      perms: [
        { en: "Read-only access to all data", zh: "对所有数据只读" },
        { en: "Cannot create, edit, or delete", zh: "不能创建、编辑或删除" },
      ],
    },
  ];

  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
      <h2 className="mb-1 flex items-center gap-2 font-display text-base font-semibold">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        {isZh ? "用户与角色权限" : "Users & Roles"}
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        {isZh
          ? "显示当前登录账号及其角色权限。首位注册用户自动获得超级管理员权限。"
          : "Shows the currently signed-in account and its role permissions. The first registered user is automatically granted Super Admin."}
      </p>

      {/* Current user card */}
      <div className="mb-5 rounded-lg border border-border bg-background/60 p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle2 className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="text-sm text-muted-foreground">{isZh ? "加载中…" : "Loading…"}</div>
            ) : email ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-display text-base font-semibold">
                    {displayName || email}
                  </div>
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <span
                        key={r}
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${ROLE_META[r]?.tone ?? ROLE_META.viewer.tone}`}
                      >
                        {isZh ? ROLE_META[r]?.zh : ROLE_META[r]?.en}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                      {isZh ? "未分配角色" : "No role assigned"}
                    </span>
                  )}
                </div>
                <div className="mt-1 truncate text-sm text-muted-foreground">{email}</div>
                <div className="mt-3 grid grid-cols-1 gap-y-1.5 text-[11.5px] text-muted-foreground sm:grid-cols-2">
                  <div>
                    <span className="text-foreground/70">{isZh ? "用户 ID：" : "User ID: "}</span>
                    <span className="font-mono">{userId?.slice(0, 8)}…</span>
                  </div>
                  {createdAt && (
                    <div>
                      <span className="text-foreground/70">{isZh ? "注册时间：" : "Joined: "}</span>
                      {new Date(createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                {isZh ? "未登录" : "Not signed in"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role matrix */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {isZh ? "角色权限说明" : "Role permissions"}
        </div>
        {ROLE_DESCRIPTIONS.map((r) => {
          const meta = ROLE_META[r.role];
          const isMine = r.role === primaryRole && !loading && roles.length > 0;
          return (
            <div
              key={r.role}
              className={
                "rounded-md border px-4 py-3 " +
                (isMine ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/40")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.tone}`}
                  >
                    {isZh ? meta.zh : meta.en}
                  </span>
                  {isMine && (
                    <span className="text-[11px] text-primary">
                      {isZh ? "· 当前账号" : "· current"}
                    </span>
                  )}
                </div>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {r.perms.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-foreground/40">•</span>
                    <span>{isZh ? p.zh : p.en}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-md border border-dashed border-border bg-background/50 px-4 py-3 text-[11.5px] text-muted-foreground">
        {isZh
          ? "多用户邀请、角色分配与权限审计将在下一版本上线。"
          : "Multi-user invitations, role assignment, and permission audit log are coming in the next release."}
      </div>
    </section>
  );
}

function TermsSection() {
  const locale = useLocale();
  const isZh = locale === "zh";
  const termsEn = useTerms((s) => s.termsEn);
  const termsZh = useTerms((s) => s.termsZh);
  const setTerms = useTerms((s) => s.setTerms);
  const resetDefaults = useTerms((s) => s.resetDefaults);

  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="mb-1 flex items-center gap-2 font-display text-base font-semibold">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {isZh ? "报价条款 (Terms & Conditions)" : "Terms & Conditions"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isZh
              ? "以下条款将自动附加到所有打印 / 导出的报价单底部，位于明细之后、签字栏之前。"
              : "Automatically appended to every printed and exported estimate, after line totals and before the signature block."}
          </p>
        </div>
        <button
          onClick={() => {
            resetDefaults();
            toast.success(isZh ? "已恢复默认条款" : "Reset to default terms");
          }}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-input bg-background px-3 text-xs font-medium hover:bg-secondary"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {isZh ? "恢复默认" : "Reset to default"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              English Terms
            </span>
            {termsEn !== DEFAULT_TERMS_EN && (
              <button
                onClick={() => setTerms({ termsEn: DEFAULT_TERMS_EN })}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                reset
              </button>
            )}
          </div>
          <textarea
            value={termsEn}
            onChange={(e) => setTerms({ termsEn: e.target.value })}
            rows={14}
            className="w-full rounded-[10px] border border-input bg-background px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed outline-none transition-colors hover:border-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
        <label className="block">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              中文条款
            </span>
            {termsZh !== DEFAULT_TERMS_ZH && (
              <button
                onClick={() => setTerms({ termsZh: DEFAULT_TERMS_ZH })}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                重置
              </button>
            )}
          </div>
          <textarea
            value={termsZh}
            onChange={(e) => setTerms({ termsZh: e.target.value })}
            rows={14}
            className="w-full rounded-[10px] border border-input bg-background px-3.5 py-2.5 font-mono text-[11.5px] leading-relaxed outline-none transition-colors hover:border-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => toast.success(isZh ? "条款已保存" : "Terms saved")}
          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
        >
          {isZh ? "保存条款" : "Save Terms"}
        </button>
      </div>
    </section>
  );
}
