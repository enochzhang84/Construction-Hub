import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, PriceItem, PricingType } from "./data";

export type Locale = "en" | "zh";
export type QuoteLanguage = "en" | "zh" | "bilingual";

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "construction-hub-locale", skipHydration: true },
  ),
);

// Rehydrate from localStorage only after the client mounts, so SSR/CSR markup matches.
function useHydratedLocale(): Locale {
  const locale = useLocaleStore((s) => s.locale);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    void useLocaleStore.persist.rehydrate();
    setHydrated(true);
  }, []);
  return hydrated ? locale : "en";
}

// ---------------- Dictionary ----------------

type Dict = Record<string, { en: string; zh: string }>;

const DICT: Dict = {
  // Nav
  "nav.dashboard": { en: "Dashboard", zh: "仪表板" },
  "nav.customers": { en: "Customers", zh: "客户管理" },
  "nav.estimates": { en: "Estimates", zh: "报价单" },
  "nav.priceBook": { en: "Price Book", zh: "价格库" },
  "nav.materials": { en: "Materials", zh: "材料库" },
  "nav.reports": { en: "Reports", zh: "报表中心" },
  "nav.settings": { en: "Settings", zh: "系统设置" },

  // App
  "app.subtitle": { en: "Estimating · v1", zh: "报价系统 · v1" },
  "app.workspace": { en: "Demo workspace", zh: "演示工作区" },
  "app.workspaceMeta": { en: "California · Local data only", zh: "加州 · 本地数据" },

  // Dashboard
  "dash.title": { en: "Dashboard", zh: "仪表板" },
  "dash.overview": { en: "Overview", zh: "概览" },
  "dash.newEstimate": { en: "New Estimate", zh: "新建报价" },
  "dash.stat.estimatesMonth": { en: "Estimates This Month", zh: "本月报价" },
  "dash.stat.closedRevenue": { en: "Closed Revenue", zh: "成交金额" },
  "dash.stat.awaiting": { en: "Awaiting Send", zh: "待发送" },
  "dash.stat.sent": { en: "Sent / Pending", zh: "已发送 / 待回复" },
  "dash.stat.closed": { en: "Closed Projects", zh: "已成交项目" },
  "dash.stat.customers": { en: "Active Customers", zh: "活跃客户" },
  "dash.stat.actionNeeded": { en: "Action needed", zh: "需处理" },
  "dash.stat.avgDays": { en: "Avg 3.2 days", zh: "平均 3.2 天" },
  "dash.recentCustomers": { en: "Recent Customers", zh: "最近客户" },
  "dash.viewAll": { en: "View all →", zh: "查看全部 →" },
  "dash.col.name": { en: "Name", zh: "姓名" },
  "dash.col.address": { en: "Project Address", zh: "项目地址" },
  "dash.col.phone": { en: "Phone", zh: "电话" },
  "dash.col.notes": { en: "Notes", zh: "备注" },

  // Customers
  "cust.title": { en: "Customers", zh: "客户管理" },
  "cust.contacts": { en: "contacts", zh: "位客户" },
  "cust.search": { en: "Search customers…", zh: "搜索客户…" },
  "cust.new": { en: "New Customer", zh: "新建客户" },
  "cust.added": { en: "Added", zh: "添加于" },
  "cust.dlg.title": { en: "New Customer", zh: "新建客户" },
  "cust.f.name": { en: "Customer Name", zh: "客户姓名" },
  "cust.f.phone": { en: "Phone", zh: "联系电话" },
  "cust.f.email": { en: "Email", zh: "邮箱" },
  "cust.f.address": { en: "Project Address", zh: "项目地址" },
  "cust.f.city": { en: "City", zh: "城市" },
  "cust.f.state": { en: "State", zh: "州" },
  "cust.f.zip": { en: "ZIP Code", zh: "邮编" },
  "cust.f.notes": { en: "Notes", zh: "备注" },
  "cust.createEstimate": { en: "Create Estimate", zh: "新建报价单" },
  "cust.history": { en: "Estimate History", zh: "历史报价单" },
  "cust.noHistory": { en: "No estimates yet.", zh: "暂无报价单。" },
  "common.save": { en: "Save", zh: "保存" },
  "common.cancel": { en: "Cancel", zh: "取消" },
  "common.edit": { en: "Edit", zh: "编辑" },
  "common.all": { en: "All", zh: "全部" },
  "common.actions": { en: "Actions", zh: "操作" },
  "pb.filter.category": { en: "Filter by Trade", zh: "施工分类筛选" },
  "pb.search.item": { en: "Search Item", zh: "项目搜索" },
  "pb.pager.prev": { en: "Previous", zh: "上一页" },
  "pb.pager.next": { en: "Next", zh: "下一页" },
  "pb.edit.title": { en: "Edit Price Item", zh: "编辑价格项目" },
  "pb.f.trade": { en: "Trade", zh: "施工分类" },
  "pb.f.item": { en: "Item Name", zh: "项目名称" },

  // Estimates
  "est.selectCustomer": { en: "— Select customer —", zh: "— 选择客户 —" },
  "est.exportPDF": { en: "Export PDF", zh: "导出 PDF" },
  "est.trades": { en: "Trades", zh: "施工分类" },
  "est.searchItems": { en: "Search items…", zh: "搜索项目…" },
  "est.addToEstimate": { en: "Add to estimate", zh: "加入报价" },
  "est.noItems": { en: "No items.", zh: "无项目。" },
  "est.lineItems": { en: "Line Items", zh: "报价明细" },
  "est.clearAll": { en: "Clear all", zh: "清空" },
  "est.empty": { en: "Empty estimate", zh: "空报价单" },
  "est.emptyHint": {
    en: "Pick a trade on the left, then add items from the middle pane.",
    zh: "从左侧选择施工分类，从中间面板添加项目。",
  },
  "est.col.item": { en: "Item", zh: "项目" },
  "est.col.pricing": { en: "Pricing", zh: "报价方式" },
  "est.col.qty": { en: "Qty", zh: "数量" },
  "est.col.unit": { en: "Unit", zh: "单位" },
  "est.col.labor": { en: "Labor", zh: "人工" },
  "est.col.material": { en: "Material", zh: "材料" },
  "est.col.disc": { en: "Disc.", zh: "折扣" },
  "est.col.total": { en: "Total", zh: "小计" },
  "est.subtotal": { en: "Subtotal", zh: "小计" },
  "est.lineDiscounts": { en: "Line discounts", zh: "单项折扣" },
  "est.globalDiscount": { en: "Global discount", zh: "总折扣" },
  "est.total": { en: "Total", zh: "总计" },
  "est.quoteLanguage": { en: "Quote Language", zh: "报价单语言" },
  "est.lang.en": { en: "English", zh: "英文" },
  "est.lang.zh": { en: "中文", zh: "中文" },
  "est.lang.bilingual": { en: "Bilingual", zh: "中英双语" },

  // Price Book
  "pb.title": { en: "Price Book", zh: "价格库" },
  "pb.items": { en: "items across", zh: "个项目，共" },
  "pb.trades": { en: "trades", zh: "个施工分类" },
  "pb.col.trade": { en: "Trade", zh: "施工分类" },
  "pb.col.item": { en: "Item", zh: "项目" },
  "pb.col.unit": { en: "Unit", zh: "单位" },
  "pb.col.defaultPricing": { en: "Default Pricing", zh: "默认报价方式" },
  "pb.col.labor": { en: "Labor", zh: "人工" },
  "pb.col.material": { en: "Material", zh: "材料" },
  "pb.col.combined": { en: "Combined", zh: "合计" },

  // Materials
  "mat.title": { en: "Materials & Suppliers", zh: "材料与供应商" },
  "mat.subtitle": {
    en: "Vendor accounts and material cost references.",
    zh: "供应商账户与材料成本参考。",
  },
  "mat.account": { en: "Account", zh: "账户" },
  "mat.terms": { en: "Terms", zh: "付款条件" },

  // Reports
  "rep.title": { en: "Reports", zh: "报表中心" },
  "rep.subtitle": { en: "Project pipeline & workflow management", zh: "工程状态与流程管理" },
  "rep.ytd": { en: "YTD Revenue", zh: "年度营收" },
  "rep.vsLast": { en: "+18.4% vs last year", zh: "+18.4% 同比" },
  "rep.byTrade": { en: "Revenue by Trade", zh: "各施工分类营收" },
  "rep.pipeline": { en: "Project Pipeline", zh: "工程状态管理" },
  "rep.records": { en: "Project Records", zh: "工程记录表" },
  "rep.col.date": { en: "Date", zh: "日期" },
  "rep.col.customer": { en: "Customer", zh: "客户" },
  "rep.col.address": { en: "Project Address", zh: "项目地址" },
  "rep.col.issueDate": { en: "Issue Date", zh: "开单日" },
  "rep.col.status": { en: "Status", zh: "报价单状态" },
  "rep.col.startDate": { en: "Construction Date", zh: "施工日期" },
  "rep.col.settlementDate": { en: "Settlement Date", zh: "结算日期" },
  "rep.col.payment": { en: "Payment Method", zh: "结款方式" },
  "rep.col.notes": { en: "Notes", zh: "备注" },
  "rep.pickDate": { en: "Pick date", zh: "选择日期" },

  // Project detail
  "proj.detail.title": { en: "Project Details", zh: "工程详情" },
  "proj.original": { en: "Original Estimate", zh: "原始报价单" },
  "proj.addons": { en: "Add-on Items", zh: "新增施工项目" },
  "proj.newAddon": { en: "+ New Add-on Item", zh: "+ 新施工项目" },
  "proj.addonHeading": { en: "New Add-on Item", zh: "新增施工项目" },
  "proj.parent": { en: "Parent Project", zh: "原工程" },
  "proj.amount": { en: "Estimate Amount", zh: "报价金额" },
  "proj.discount": { en: "Discount", zh: "优惠金额" },
  "proj.final": { en: "Final Amount", zh: "最终金额" },
  "proj.lineItems": { en: "Line Items", zh: "报价明细" },
  "proj.noAddons": { en: "No add-on items yet.", zh: "暂无新增施工项目。" },
  "proj.back": { en: "Back", zh: "返回" },
  "proj.addonForm.item": { en: "Item Name", zh: "项目名称" },
  "proj.addonForm.qty": { en: "Quantity", zh: "数量" },
  "proj.addonForm.unit": { en: "Unit", zh: "单位" },
  "proj.addonForm.price": { en: "Unit Price", zh: "单价" },
  "proj.addonForm.addLine": { en: "+ Add Line", zh: "+ 添加项目" },
  "proj.addonForm.save": { en: "Save Add-on", zh: "保存新增项目" },
  "proj.addonForm.notes": { en: "Notes", zh: "备注" },

  // Customers recent
  "cust.recent": { en: "Recent Customer Activity", zh: "最近客户" },
  "cust.col.lastDate": { en: "Last Estimate Date", zh: "最近报价日期" },
  "cust.col.lastStatus": { en: "Last Status", zh: "最近状态" },

  // Settings
  "set.title": { en: "Settings", zh: "系统设置" },
  "set.subtitle": { en: "Company profile, roles, and defaults.", zh: "公司信息、角色与默认设置。" },
  "set.company": { en: "Company", zh: "公司信息" },
  "set.roles": { en: "Roles & Permissions", zh: "角色与权限" },
  "set.edit": { en: "Edit", zh: "编辑" },
  "set.roadmap": { en: "Roadmap", zh: "版本规划" },
  "set.roadmapHint": { en: "Planned for upcoming releases.", zh: "未来版本规划。" },
  "set.field.company": { en: "Company Name", zh: "公司名称" },
  "set.field.license": { en: "License #", zh: "执照号" },
  "set.field.address": { en: "Address", zh: "地址" },
  "set.field.phone": { en: "Phone", zh: "电话" },
  "set.field.email": { en: "Email", zh: "邮箱" },
  "set.field.tax": { en: "Default Tax Rate", zh: "默认税率" },
  "set.role.admin": { en: "Super Admin", zh: "超级管理员" },
  "set.role.admin.desc": {
    en: "Full access · price book · users · billing",
    zh: "完整权限 · 价格库 · 用户 · 账单",
  },
  "set.role.estimator": { en: "Estimator", zh: "报价员" },
  "set.role.estimator.desc": {
    en: "Create / edit estimates · view price book",
    zh: "创建/编辑报价 · 查看价格库",
  },
  "set.role.sales": { en: "Sales", zh: "销售" },
  "set.role.sales.desc": {
    en: "View & send estimates · manage customers",
    zh: "查看与发送报价 · 管理客户",
  },
  "set.role.viewer": { en: "Viewer", zh: "查看者" },
  "set.role.viewer.desc": { en: "Read-only access", zh: "只读权限" },

  // PDF
  "pdf.brand": { en: "Construction Hub", zh: "Construction Hub" },
  "pdf.subtitle": { en: "Contractor Estimate", zh: "装修报价单" },
  "pdf.estimate": { en: "Estimate", zh: "报价编号" },
  "pdf.date": { en: "Date", zh: "日期" },
  "pdf.billTo": { en: "Bill To", zh: "客户" },
  "pdf.discounts": { en: "Discounts", zh: "折扣合计" },
  "pdf.footer": {
    en: "Quote valid for 30 days. Pricing subject to site verification.",
    zh: "报价 30 天内有效，最终价格以现场核对为准。",
  },
  "pdf.signature": {
    en: "Customer signature: ____________________________   Date: __________",
    zh: "客户签字：____________________________   日期：__________",
  },
};

// ---------------- Hook / helpers ----------------

export function useT() {
  const locale = useHydratedLocale();
  return (key: keyof typeof DICT | string) => {
    const entry = DICT[key as string];
    if (!entry) return key as string;
    return entry[locale];
  };
}

export function useLocale() {
  return useHydratedLocale();
}

export function tCategory(cat: Category, locale: Locale): string {
  return locale === "zh" ? cat.nameZh : cat.name;
}

export function tItem(item: PriceItem, locale: Locale): string {
  return locale === "zh" ? item.nameZh || item.name : item.name;
}

export function tPricing(p: PricingType, locale: Locale): string {
  if (locale === "en") return p;
  const map: Record<PricingType, string> = {
    "Labor Only": "仅人工",
    "Labor + Material": "人工 + 材料",
    "Customer Supplied Material": "客供材料",
    Turnkey: "包工包料",
    Estimate: "估价",
    Custom: "自定义",
  };
  return map[p];
}

export function tUnit(unit: string, locale: Locale): string {
  if (locale === "en") return unit;
  const map: Record<string, string> = {
    sqft: "平方英尺",
    sf: "平方英尺",
    lf: "线英尺",
    ea: "个",
    sq: "方",
    hr: "小时",
  };
  return map[unit.toLowerCase()] ?? unit;
}
