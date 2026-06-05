import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HardHat, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale, useLocaleStore } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign in · Contractor Estimating System" }],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const locale = useLocale();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const isZh = locale === "zh";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // If already signed in, send to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          const m = isZh
            ? "该邮箱已注册，请直接登录或重置密码。"
            : "This email is already registered. Please sign in instead.";
          setNotice(m);
          toast.error(m, { duration: 5000 });
          setMode("signin");
        } else {
          const m = isZh
            ? "注册成功！请检查邮箱（含垃圾邮件）完成验证后再登录。"
            : "Account created! Check your email (incl. spam) to confirm, then sign in.";
          setNotice(m);
          toast.success(m, { duration: 6000 });
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(isZh ? "登录成功" : "Signed in", { duration: 3000 });
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-secondary/40 via-background to-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {isZh ? "返回主页" : "Back to home"}
          </Link>
          <div className="inline-flex items-center gap-1 rounded-md border border-input bg-card px-1.5 py-1 text-xs">
            <button
              onClick={() => setLocale("en")}
              className={
                "rounded px-2 py-0.5 " +
                (locale === "en" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground")
              }
            >
              EN
            </button>
            <button
              onClick={() => setLocale("zh")}
              className={
                "rounded px-2 py-0.5 " +
                (locale === "zh" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground")
              }
            >
              中文
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HardHat className="h-5 w-5" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold">
            {mode === "signin"
              ? isZh
                ? "登录后台"
                : "Sign in"
              : isZh
                ? "注册账号"
                : "Create account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isZh
              ? "Contractor Estimating System"
              : "Contractor Estimating System"}
          </p>

          {notice && (
            <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
              {notice}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <Field
                label={isZh ? "显示名称" : "Display name"}
                value={displayName}
                onChange={setDisplayName}
                placeholder={isZh ? "您的姓名" : "Your name"}
              />
            )}
            <Field
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
            />
            <Field
              label={isZh ? "密码" : "Password"}
              type="password"
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              minLength={6}
            />

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy
                ? isZh
                  ? "处理中…"
                  : "Please wait…"
                : mode === "signin"
                  ? isZh
                    ? "登录"
                    : "Sign in"
                  : isZh
                    ? "注册"
                    : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                {isZh ? "没有账号？" : "No account?"}{" "}
                <button
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                  onClick={() => setMode("signup")}
                >
                  {isZh ? "立即注册" : "Sign up"}
                </button>
              </>
            ) : (
              <>
                {isZh ? "已有账号？" : "Already have an account?"}{" "}
                <button
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                  onClick={() => setMode("signin")}
                >
                  {isZh ? "立即登录" : "Sign in"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  autoComplete,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-shadow focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
