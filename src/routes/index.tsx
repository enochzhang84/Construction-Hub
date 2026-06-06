import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  HardHat,
  Phone,
  Mail,
  MapPin,
  BadgeCheck,
  Globe2,
  ArrowRight,
  Users,
  FileText,
  Hammer,
  Truck,
  LayoutDashboard,
  BarChart3,
  CheckCircle2,
  MessageSquare,
  ClipboardCheck,
  Wrench,
  Wallet,
  Menu,
  X,
} from "lucide-react";
import { useCompany, useCompanyHydration } from "@/lib/company-store";
import { useLocale, useLocaleStore } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contractor Estimating System — Modern software for remodeling pros" },
      {
        name: "description",
        content:
          "All-in-one platform for US contractors: customer management, fast estimates, project tracking, supplier management, PDF quotes and bilingual EN/中文 support.",
      },
    ],
  }),
  component: PublicHome,
});

function PublicHome() {
  const storeProfile = useCompany((s) => s.profile);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  useCompanyHydration();
  const profile = mounted
    ? storeProfile
    : { name: "", logoUrl: "", phone: "", email: "", address: "", license: "", website: "", taxRate: "0" };
  const locale = useLocale();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const isZh = locale === "zh";

  const companyName = profile.name || (isZh ? "您的装修公司" : "Your Contracting Company");

  const t = {
    navHome: isZh ? "首页" : "Home",
    navFeatures: isZh ? "功能" : "Features",
    navContact: isZh ? "联系我们" : "Contact",
    login: isZh ? "登录后台" : "Login",
    heroTitle1: isZh ? "装修报价更快" : "Estimates done faster",
    heroTitle2: isZh ? "客户管理更简单" : "Customers organized",
    heroTitle3: isZh ? "施工流程更清晰" : "Projects on track",
    heroSub: isZh
      ? "专为美国装修公司打造的 Contractor Estimating System，支持客户管理、报价管理、施工管理、供货商管理、PDF 报价、中英双语。"
      : "The Contractor Estimating System built for US remodeling companies. Customers, estimates, projects, suppliers, PDF quotes — in English and 中文.",
    ctaStart: isZh ? "开始报价" : "Start Estimating",
    ctaLogin: isZh ? "登录后台" : "Login",
    featuresEyebrow: isZh ? "核心功能" : "Core Features",
    featuresTitle: isZh ? "经营装修生意所需的一切" : "Everything you need to run the business",
    featuresSub: isZh
      ? "从客户到结算，所有流程集中在一个系统。"
      : "From first lead to final payment — one connected workspace.",
    flowEyebrow: isZh ? "工作流程" : "Workflow",
    flowTitle: isZh ? "清晰的项目流转" : "A clear path for every project",
    screensEyebrow: isZh ? "界面预览" : "Product Tour",
    screensTitle: isZh ? "为承包商精心打造的界面" : "Interfaces designed for contractors",
    contactEyebrow: isZh ? "联系我们" : "Contact",
    contactTitle: isZh ? "随时为您服务" : "We're here to help",
  };

  const features = [
    {
      icon: Users,
      title: isZh ? "客户管理" : "Customer Management",
      desc: isZh
        ? "集中管理客户档案、联系方式、地址与项目历史。"
        : "Centralize leads, contacts, addresses and full project history.",
    },
    {
      icon: FileText,
      title: isZh ? "报价管理" : "Estimate Management",
      desc: isZh
        ? "快速生成专业报价单，支持 PDF 导出与中英双语。"
        : "Build pro estimates in minutes. Export to PDF, bilingual ready.",
    },
    {
      icon: Hammer,
      title: isZh ? "工程管理" : "Project Management",
      desc: isZh
        ? "跟踪每个项目的施工进度、付款节点与变更单。"
        : "Track progress, payment milestones and change orders in one place.",
    },
    {
      icon: Truck,
      title: isZh ? "供货商管理" : "Supplier Management",
      desc: isZh
        ? "管理材料供应商与采购记录，控制项目成本。"
        : "Manage vendors and purchasing to keep project costs under control.",
    },
  ];

  const flow = [
    { icon: MessageSquare, label: isZh ? "客户咨询" : "Inquiry" },
    { icon: FileText, label: isZh ? "创建报价" : "Estimate" },
    { icon: ClipboardCheck, label: isZh ? "客户确认" : "Approved" },
    { icon: Wrench, label: isZh ? "施工中" : "In Progress" },
    { icon: Wallet, label: isZh ? "待结算" : "Billing" },
    { icon: CheckCircle2, label: isZh ? "已完成" : "Completed" },
  ];

  const screens: { title: string; icon: typeof LayoutDashboard; render: () => React.ReactElement }[] = [
    { title: "Dashboard", icon: LayoutDashboard, render: () => <ScreenDashboard /> },
    { title: "Customers", icon: Users, render: () => <ScreenCustomers /> },
    { title: "Estimates", icon: FileText, render: () => <ScreenEstimates /> },
    { title: "Reports", icon: BarChart3, render: () => <ScreenReports /> },
  ];

  return (
    <div className="min-h-screen w-full bg-white text-slate-900">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={companyName}
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-contain bg-white ring-1 ring-slate-200 p-1"
              />
            ) : (
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
                <HardHat className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            )}
            <div className="leading-tight min-w-0">
              <div className="truncate text-[20px] sm:text-[24px] font-bold tracking-tight text-slate-900">
                {companyName}
              </div>
              <div className="hidden sm:block text-[12px] text-slate-500">
                Professional Remodeling Contractor
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-[15px] text-slate-600 lg:flex">
            <a href="#home" className="hover:text-slate-900">{t.navHome}</a>
            <a href="#features" className="hover:text-slate-900">{t.navFeatures}</a>
            <a href="#contact" className="hover:text-slate-900">{t.navContact}</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden h-10 items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 text-[15px] sm:inline-flex">
              <button
                onClick={() => setLocale("en")}
                className={
                  "h-8 rounded-full px-3 font-medium transition-colors " +
                  (locale === "en" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900")
                }
              >
                English
              </button>
              <button
                onClick={() => setLocale("zh")}
                className={
                  "h-8 rounded-full px-3 font-medium transition-colors " +
                  (locale === "zh" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900")
                }
              >
                中文
              </button>
            </div>
            <Link
              to="/dashboard"
              className="hidden h-12 w-[140px] items-center justify-center gap-1.5 rounded-full bg-slate-900 text-[15px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:inline-flex"
            >
              {t.login}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 sm:hidden"
              aria-label="menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-6 py-4 sm:hidden">
            <div className="flex flex-col gap-4 text-[15px]">
              <a href="#home" onClick={() => setMenuOpen(false)}>{t.navHome}</a>
              <a href="#features" onClick={() => setMenuOpen(false)}>{t.navFeatures}</a>
              <a href="#contact" onClick={() => setMenuOpen(false)}>{t.navContact}</a>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setLocale("en")}
                  className={"h-9 rounded-full px-4 text-sm font-medium " + (locale === "en" ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-700")}
                >
                  English
                </button>
                <button
                  onClick={() => setLocale("zh")}
                  className={"h-9 rounded-full px-4 text-sm font-medium " + (locale === "zh" ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-700")}
                >
                  中文
                </button>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-slate-900 text-[15px] font-semibold text-white"
              >
                {t.login}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(59,130,246,0.08),transparent_70%)]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {isZh ? "现代承包商管理系统" : "Modern Contractor Platform"}
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              <span className="block">{t.heroTitle1}</span>
              <span className="block">{t.heroTitle2}</span>
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t.heroTitle3}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">{t.heroSub}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
              >
                {t.ctaStart}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
              >
                {t.ctaLogin}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
              {[
                isZh ? "客户管理" : "Customers",
                isZh ? "报价管理" : "Estimates",
                isZh ? "施工管理" : "Projects",
                isZh ? "供货商管理" : "Suppliers",
                "PDF",
                isZh ? "中英双语" : "EN / 中文",
              ].map((x) => (
                <div key={x} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {x}
                </div>
              ))}
            </div>
          </div>

          {/* MacBook-style mockup */}
          <div className="relative">
            <MacbookFrame>
              <ScreenDashboard />
            </MacbookFrame>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-200 bg-slate-50/60 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-blue-600">{t.featuresEyebrow}</div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{t.featuresTitle}</h2>
            <p className="mt-4 text-lg text-slate-600">{t.featuresSub}</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-blue-600">{t.flowEyebrow}</div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{t.flowTitle}</h2>
          </div>

          <div className="relative mt-16">
            {/* connecting line */}
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent md:block" />
            <ol className="grid grid-cols-2 gap-y-10 sm:grid-cols-3 md:grid-cols-6">
              {flow.map((step, i) => (
                <li key={step.label} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 shadow-sm">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{step.label}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Screens showcase */}
      <section className="border-t border-slate-200 bg-slate-50/60 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-blue-600">{t.screensEyebrow}</div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{t.screensTitle}</h2>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-2">
            {screens.map((s) => (
              <div key={s.title}>
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <s.icon className="h-4 w-4 text-blue-600" />
                  {s.title}
                </div>
                <MacbookFrame>{s.render()}</MacbookFrame>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Company info */}
      <section id="contact" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-blue-600">{t.contactEyebrow}</div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{t.contactTitle}</h2>
          </div>

          <div className="mx-auto mt-12 max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <div className="flex items-center gap-3">
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt={companyName} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <HardHat className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <div className="text-xl font-semibold tracking-tight">{companyName}</div>
                    {profile.license && (
                      <div className="text-xs text-slate-500">
                        {isZh ? "执照编号" : "License"} · {profile.license}
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-600">
                  {isZh
                    ? "我们是一家专注于住宅与商业装修的专业承包商，提供报价、施工管理与售后服务一体化解决方案。"
                    : "A licensed remodeling contractor offering residential and commercial construction, project management and after-service support."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <InfoRow icon={<Phone className="h-4 w-4" />} label={isZh ? "电话" : "Phone"} value={profile.phone || (isZh ? "未填写" : "Not provided")} />
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email || (isZh ? "未填写" : "Not provided")} />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label={isZh ? "地址" : "Address"} value={profile.address || (isZh ? "未填写" : "Not provided")} />
                {profile.website && (
                  <InfoRow icon={<Globe2 className="h-4 w-4" />} label={isZh ? "网站" : "Website"} value={profile.website} />
                )}
                {profile.license && (
                  <InfoRow icon={<BadgeCheck className="h-4 w-4" />} label={isZh ? "执照编号" : "License No."} value={profile.license} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 text-xs text-slate-500 sm:flex-row">
          <div>© {new Date().getFullYear()} {companyName}. {isZh ? "保留所有权利。" : "All rights reserved."}</div>
          <div>Powered by Contractor Estimating System</div>
        </div>
      </footer>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
        <div className="truncate text-sm font-medium text-slate-900">{value}</div>
      </div>
    </div>
  );
}

/* ---------------- MacBook Mockup ---------------- */

function MacbookFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      {/* Lid */}
      <div className="rounded-[18px] bg-slate-900 p-2.5 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-800">
        <div className="overflow-hidden rounded-[10px] bg-white">
          <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="aspect-[16/10] w-full overflow-hidden bg-white">{children}</div>
        </div>
      </div>
      {/* Base */}
      <div className="mx-auto h-3 w-[105%] -translate-x-[2.5%] rounded-b-2xl bg-gradient-to-b from-slate-300 to-slate-200 shadow-md" />
      <div className="mx-auto h-1 w-[40%] rounded-b-md bg-slate-300/60" />
    </div>
  );
}

/* ---------------- Mock Screens ---------------- */

function MockChrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full bg-white text-[10px] text-slate-700">
      <aside className="hidden w-[22%] flex-col gap-1 border-r border-slate-100 bg-slate-50/70 p-3 sm:flex">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-900">
          <div className="h-4 w-4 rounded bg-slate-900" />
          Estimating
        </div>
        {["Dashboard", "Customers", "Estimates", "Projects", "Suppliers", "Reports"].map((x) => (
          <div
            key={x}
            className={
              "rounded px-2 py-1 " +
              (x === title ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100")
            }
          >
            {x}
          </div>
        ))}
      </aside>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
          <div className="text-[11px] font-semibold text-slate-900">{title}</div>
          <div className="h-4 w-20 rounded-full bg-slate-100" />
        </div>
        <div className="flex-1 overflow-hidden p-3">{children}</div>
      </div>
    </div>
  );
}

function ScreenDashboard() {
  const stats = [
    { label: "Estimates", value: "24", tone: "bg-blue-50 text-blue-700" },
    { label: "Revenue", value: "$182k", tone: "bg-emerald-50 text-emerald-700" },
    { label: "Active", value: "11", tone: "bg-violet-50 text-violet-700" },
    { label: "Pending", value: "6", tone: "bg-amber-50 text-amber-700" },
  ];
  return (
    <MockChrome title="Dashboard">
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className={"rounded-md p-2 " + s.tone}>
            <div className="text-[8px] uppercase tracking-wider opacity-70">{s.label}</div>
            <div className="text-sm font-semibold">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="col-span-2 rounded-md border border-slate-100 p-2">
          <div className="mb-1 text-[9px] font-medium text-slate-500">Monthly Revenue</div>
          <div className="flex h-20 items-end gap-1">
            {[40, 60, 35, 70, 55, 85, 65, 90, 50, 75, 80, 95].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-blue-500 to-blue-300" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-md border border-slate-100 p-2">
          <div className="mb-1 text-[9px] font-medium text-slate-500">Pipeline</div>
          {["Lead", "Quoted", "Won", "Building"].map((x, i) => (
            <div key={x} className="mb-1.5">
              <div className="flex justify-between text-[8px] text-slate-500"><span>{x}</span><span>{[8, 6, 4, 3][i]}</span></div>
              <div className="mt-0.5 h-1 rounded-full bg-slate-100">
                <div className="h-1 rounded-full bg-blue-500" style={{ width: `${[80, 60, 40, 30][i]}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockChrome>
  );
}

function ScreenCustomers() {
  const rows = [
    ["Anderson Family", "Palo Alto, CA", "Active"],
    ["BlueOak Realty", "San Jose, CA", "Lead"],
    ["Chen Residence", "Cupertino, CA", "Active"],
    ["Downtown Lofts", "Mountain View, CA", "Quoted"],
    ["Evergreen LLC", "Sunnyvale, CA", "Done"],
  ];
  return (
    <MockChrome title="Customers">
      <div className="rounded-md border border-slate-100">
        <div className="grid grid-cols-[1.4fr_1.2fr_0.8fr] gap-2 border-b border-slate-100 bg-slate-50/70 px-2 py-1 text-[9px] uppercase tracking-wider text-slate-500">
          <div>Customer</div><div>Address</div><div>Status</div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1.4fr_1.2fr_0.8fr] items-center gap-2 border-b border-slate-50 px-2 py-1.5 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500" />
              <span className="font-medium text-slate-800">{r[0]}</span>
            </div>
            <div className="text-slate-500">{r[1]}</div>
            <div>
              <span className={
                "rounded-full px-1.5 py-0.5 text-[8px] font-medium " +
                (r[2] === "Active" ? "bg-emerald-50 text-emerald-700" :
                 r[2] === "Lead" ? "bg-blue-50 text-blue-700" :
                 r[2] === "Quoted" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600")
              }>{r[2]}</span>
            </div>
          </div>
        ))}
      </div>
    </MockChrome>
  );
}

function ScreenEstimates() {
  return (
    <MockChrome title="Estimates">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 rounded-md border border-slate-100 p-2">
          <div className="text-[10px] font-semibold text-slate-800">Estimate #2026-0412</div>
          <div className="text-[9px] text-slate-500">Anderson Family · Kitchen Remodel</div>
          <div className="mt-2 space-y-1">
            {[
              ["Demo & disposal", "$1,200"],
              ["Cabinets — custom", "$8,400"],
              ["Quartz countertop", "$3,200"],
              ["Plumbing rough-in", "$1,650"],
              ["Tile & backsplash", "$2,100"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-dashed border-slate-100 py-0.5 text-[9px]">
                <span className="text-slate-600">{k}</span><span className="font-medium text-slate-900">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between rounded-md bg-slate-900 px-2 py-1.5 text-[10px] text-white">
            <span>Total</span><span className="font-semibold">$16,550</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="rounded-md border border-slate-100 p-2">
            <div className="text-[9px] font-medium text-slate-500">Status</div>
            <div className="mt-1 inline-block rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-medium text-emerald-700">Sent · awaiting</div>
          </div>
          <div className="rounded-md border border-slate-100 p-2">
            <div className="text-[9px] font-medium text-slate-500">Language</div>
            <div className="mt-1 text-[10px] font-semibold text-slate-800">EN / 中文</div>
          </div>
          <div className="rounded-md border border-slate-100 p-2">
            <div className="text-[9px] font-medium text-slate-500">Export</div>
            <div className="mt-1 text-[10px] font-semibold text-blue-600">PDF ready</div>
          </div>
        </div>
      </div>
    </MockChrome>
  );
}

function ScreenReports() {
  return (
    <MockChrome title="Reports">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-slate-100 p-2">
          <div className="text-[9px] font-medium text-slate-500">Revenue by Month</div>
          <svg viewBox="0 0 100 50" className="mt-1 h-20 w-full">
            <polyline fill="none" stroke="#3b82f6" strokeWidth="1.5" points="0,40 10,32 20,36 30,25 40,28 50,18 60,22 70,12 80,16 90,8 100,10" />
            <polyline fill="rgba(59,130,246,0.12)" stroke="none" points="0,40 10,32 20,36 30,25 40,28 50,18 60,22 70,12 80,16 90,8 100,10 100,50 0,50" />
          </svg>
        </div>
        <div className="rounded-md border border-slate-100 p-2">
          <div className="text-[9px] font-medium text-slate-500">Job Mix</div>
          <div className="mt-2 flex items-center gap-3">
            <svg viewBox="0 0 36 36" className="h-16 w-16">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="6" strokeDasharray="55 100" transform="rotate(-90 18 18)" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray="25 100" strokeDashoffset="-55" transform="rotate(-90 18 18)" />
            </svg>
            <div className="space-y-1 text-[9px]">
              <div className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Kitchen 55%</div>
              <div className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Bath 25%</div>
              <div className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Other 20%</div>
            </div>
          </div>
        </div>
        <div className="col-span-2 rounded-md border border-slate-100 p-2">
          <div className="text-[9px] font-medium text-slate-500">Top Customers</div>
          <div className="mt-1 space-y-1">
            {[["Anderson Family", 92], ["BlueOak Realty", 76], ["Chen Residence", 60], ["Evergreen LLC", 44]].map(([n, w]) => (
              <div key={n as string} className="flex items-center gap-2 text-[9px]">
                <span className="w-24 truncate text-slate-600">{n}</span>
                <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${w}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockChrome>
  );
}
