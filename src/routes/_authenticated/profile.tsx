import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useCompany, useCompanyHydration, type CompanyProfile } from "@/lib/company-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, UserCircle2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile · Construction Hub" }] }),
  component: ProfilePage,
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

const ACCEPTED_LOGO_TYPES = "image/svg+xml,image/png,image/jpeg,image/webp,image/gif,image/avif,image/x-icon,image/vnd.microsoft.icon";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function readSvgAsInlineDataURL(file: File): Promise<string> {
  const text = await file.text();
  return `data:image/svg+xml;utf8,${encodeURIComponent(text)}`;
}

function LogoUploader() {
  const logoUrl = useCompany((s) => s.profile.logoUrl);
  const setProfile = useCompany((s) => s.setProfile);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("图片过大，请选择 2MB 以内的图片");
      return;
    }
    try {
      setUploading(true);
      const dataUrl =
        file.type === "image/svg+xml"
          ? await readSvgAsInlineDataURL(file)
          : await readFileAsDataURL(file);
      setProfile({ logoUrl: dataUrl });
      toast.success("Logo 已上传");
    } catch (e) {
      console.error(e);
      toast.error("上传失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-1 text-xs font-medium text-muted-foreground">Company Logo</div>
      <div className="flex items-center gap-4 rounded-md border border-dashed border-border bg-secondary/30 p-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-background overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo preview" className="h-full w-full object-contain" />
          ) : (
            <span className="text-[10px] text-muted-foreground">No logo</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_LOGO_TYPES}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "上传中…" : logoUrl ? "更换 Logo" : "上传 Logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setProfile({ logoUrl: "" })}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                移除
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            支持 SVG、PNG、JPG、WebP、GIF、AVIF、ICO。推荐 SVG。最大 2MB。
          </p>
        </div>
      </div>
    </div>
  );
}

type RoleKey = "super_admin" | "admin" | "estimator" | "sales" | "viewer";
const ROLE_META: Record<RoleKey, { en: string; zh: string; tone: string }> = {
  super_admin: { en: "Super Admin", zh: "超级管理员", tone: "bg-primary/15 text-primary border-primary/30" },
  admin: { en: "Admin", zh: "管理员", tone: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  estimator: { en: "Estimator", zh: "报价员", tone: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  sales: { en: "Sales", zh: "销售", tone: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  viewer: { en: "Viewer", zh: "只读", tone: "bg-muted text-muted-foreground border-border" },
};

function AccountCard() {
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

  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        {isZh ? "账户信息" : "Account"}
      </h2>
      <div className="rounded-lg border border-border bg-background/60 p-4">
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
                  <div className="font-display text-base font-semibold">{displayName || email}</div>
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
              <div className="text-sm text-muted-foreground">{isZh ? "未登录" : "Not signed in"}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfilePage() {
  const locale = useLocale();
  const isZh = locale === "zh";
  useCompanyHydration();

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-8 py-5">
        <h1 className="font-display text-2xl font-semibold">{isZh ? "我的资料" : "My Profile"}</h1>
        <p className="text-sm text-muted-foreground">
          {isZh ? "管理您的账户信息与公司资料" : "Manage your account and company information"}
        </p>
      </header>
      <div className="flex-1 overflow-y-auto finder-scroll p-8 space-y-6 max-w-3xl">
        <AccountCard />

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
            <Field label="Default Tax Rate (%)" field="taxRate" type="number" placeholder="0" />
            <div className="sm:col-span-2">
              <LogoUploader />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => toast.success("Company profile saved")}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Save Changes
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
