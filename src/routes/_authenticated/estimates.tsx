import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, Trash2, Download, ChevronRight, Tag, Save, Printer, User, FileText, FilePlus, Eye } from "lucide-react";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import { CATEGORIES, PRICE_ITEMS, PRICING_TYPES, type PricingType, type Customer } from "@/lib/data";
import { useCustomers } from "@/lib/customer-store";
import { useProjects } from "@/lib/project-store";
import { useCompany, type CompanyProfile } from "@/lib/company-store";
import { useEstimate, lineTotal, estimateTotals, type EstimateLine, type EstimateMeta } from "@/lib/estimate-store";
import { nextEstimateNumber, seedEstimateNumberFrom } from "@/lib/estimate-number";
import { useTerms } from "@/lib/terms-store";
import { useT, useLocale, tCategory, tItem, tPricing, tUnit, type QuoteLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/estimates")({
  validateSearch: (s: Record<string, unknown>) => ({
    customerId: typeof s.customerId === "string" ? s.customerId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Estimates · Construction Hub" },
      { name: "description", content: "Three-pane estimator: pick a trade, add line items, generate a bilingual PDF quote." },
    ],
  }),
  component: EstimatesPage,
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function buildProjectAddress(c: { address: string; unit?: string; suite?: string; building?: string; city: string; state: string; zip: string; country?: string }): string {
  const lines: string[] = [];
  if (c.address?.trim()) lines.push(c.address.trim());
  if (c.unit?.trim()) lines.push(c.unit.trim());
  if (c.suite?.trim()) lines.push(`Suite ${c.suite.trim()}`);
  if (c.building?.trim()) lines.push(`Building ${c.building.trim()}`);
  const cityStateZip = [c.city, `${c.state} ${c.zip}`.trim()].filter(Boolean).join(", ");
  if (cityStateZip) lines.push(cityStateZip);
  if (c.country?.trim()) lines.push(c.country.trim());
  return lines.join("\n");
}

function formatDateAddDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function EstimatesPage() {
  const t = useT();
  const locale = useLocale();
  const isZh = locale === "zh";
  const { customerId: prefillId } = Route.useSearch();
  const customers = useCustomers((s) => s.customers);
  const upsertProject = useProjects((s) => s.upsertByEstimateNumber);
  const allProjects = useProjects((s) => s.projects);
  // Keep today's daily counter in sync with any estimate numbers already in the projects store
  useEffect(() => {
    seedEstimateNumberFrom(allProjects.map((p) => p.estimateNumber));
  }, [allProjects]);
  const company = useCompany((s) => s.profile);
  const termsEn = useTerms((s) => s.termsEn);
  const termsZh = useTerms((s) => s.termsZh);
  const [activeCat, setActiveCat] = useState(CATEGORIES[4].id); // Flooring
  const [itemQ, setItemQ] = useState("");
  const [mode, setMode] = useState<"view" | "create">("view");
  const isView = mode === "view";
  const { meta, lines, addLine, updateLine, removeLine, setMeta, clear } = useEstimate();
  const linesScrollRef = useRef<HTMLDivElement>(null);

  const applyCustomer = (c: Customer | null) => {
    if (isView) return;
    setMeta({
      customerId: c?.id ?? null,
      customerName: c?.name ?? "",
      projectAddress: c ? buildProjectAddress(c) : "",
    });
  };

  const newEstimateNumber = () => nextEstimateNumber();

  const onNewEstimate = () => {
    clear();
    setMeta({
      customerId: null,
      customerName: "",
      projectAddress: "",
      estimateNumber: newEstimateNumber(),
      date: new Date().toISOString().slice(0, 10),
      globalDiscount: 0,
    });
    setMode("create");
    toast.success(isZh ? "新建报价单已开启" : "New estimate started");
  };

  // Pre-fill from ?customerId= when navigated from Customers page → enter create mode
  const appliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!prefillId || appliedRef.current === prefillId) return;
    const c = customers.find((x) => x.id === prefillId);
    if (c) {
      clear();
      setMeta({
        customerId: c.id,
        customerName: c.name,
        projectAddress: buildProjectAddress(c),
        estimateNumber: newEstimateNumber(),
        date: new Date().toISOString().slice(0, 10),
        globalDiscount: 0,
      });
      setMode("create");
      appliedRef.current = prefillId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillId, customers]);

  const items = useMemo(() => {
    const needle = itemQ.toLowerCase();
    return PRICE_ITEMS.filter((i) => i.categoryId === activeCat).filter((i) =>
      (i.name + " " + (i.nameZh ?? "")).toLowerCase().includes(needle),
    );
  }, [activeCat, itemQ]);

  const totals = estimateTotals(lines, meta.globalDiscount);
  const hasCustomer = !!meta.customerId;
  const selectedCustomer = useMemo(
    () => (meta.customerId ? customers.find((c) => c.id === meta.customerId) ?? null : null),
    [meta.customerId, customers],
  );

  const categoryItemCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of PRICE_ITEMS) m.set(it.categoryId, (m.get(it.categoryId) ?? 0) + 1);
    return m;
  }, []);

  const scrollToLines = () => {
    requestAnimationFrame(() => {
      linesScrollRef.current?.scrollTo({ top: linesScrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const handleAddItem = (it: typeof PRICE_ITEMS[number]) => {
    if (isView) {
      toast.error(isZh ? "请先点击「新增报价单」" : "Click '+ New Estimate' first");
      return;
    }
    const cat = CATEGORIES.find((c) => c.id === it.categoryId)!;
    addLine({
      categoryId: cat.id,
      categoryName: cat.name,
      itemId: it.id,
      itemName: it.name,
      unit: it.unit,
      pricingType: it.defaultPricing,
      quantity: 1,
      hoursPerUnit: it.hoursPerUnit,
      laborRate: it.laborRate,
      materialRate: it.materialRate,
      discount: 0,
    });
    scrollToLines();
  };

  const onSave = () => {
    if (isView) return;
    if (!hasCustomer) {
      toast.error(isZh ? "请先选择客户" : "Please select a customer first");
      return;
    }
    if (lines.length === 0) {
      toast.error(isZh ? "请至少添加一个项目" : "Add at least one item");
      return;
    }
    upsertProject({
      customerId: meta.customerId ?? null,
      customerName: meta.customerName,
      customerPhone: selectedCustomer?.phone,
      projectAddress: meta.projectAddress,
      estimateNumber: meta.estimateNumber,
      amount: totals.total,
      discount: meta.globalDiscount,
      paidAmount: 0,
      estimateDate: meta.date,
      issueDate: meta.date,
      status: "Estimate",
      subStatus: "Draft",
      lineItems: lines.map((l) => ({
        id: l.id,
        categoryName: l.categoryName,
        name: l.itemName,
        qty: l.quantity,
        unit: l.unit,
        unitPrice: l.laborRate + l.materialRate,
        amount: lineTotal(l) + l.discount,
      })),
    });
    toast.success(isZh ? "保存成功" : "Saved successfully");
    setMode("view");
  };

  const onExport = () => {
    if (!hasCustomer) {
      toast.error(isZh ? "请先选择客户" : "Please select a customer first");
      return;
    }
    exportPDF(meta, lines, totals, company, selectedCustomer, { termsEn, termsZh }, false);
  };

  const onPrint = () => {
    if (!hasCustomer) {
      toast.error(isZh ? "请先选择客户" : "Please select a customer first");
      return;
    }
    if (lines.length === 0) {
      toast.error(isZh ? "请添加项目" : "Add at least one item");
      return;
    }
    exportPDF(meta, lines, totals, company, selectedCustomer, { termsEn, termsZh }, true);
  };

  const lockReason = !hasCustomer
    ? isZh ? "请先选择客户" : "Please select a customer first"
    : lines.length === 0
    ? isZh ? "请添加项目" : "Add at least one item"
    : "";

  return (
    <div className="flex h-full flex-col bg-[oklch(0.985_0.005_240)] dark:bg-background">
      {/* Header card */}
      <header className="border-b border-border bg-card px-6 py-4 shadow-[0_1px_0_0_oklch(0.92_0.005_240)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* 1. Estimate number */}
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {isZh ? "报价单编号" : "Estimate No."}
              </div>
              <div className="flex items-center gap-2">
                <div className="font-display font-mono text-base font-semibold tracking-tight" suppressHydrationWarning>
                  {meta.estimateNumber}
                </div>
                <span
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                    (isView
                      ? "bg-secondary text-muted-foreground"
                      : "bg-[oklch(0.95_0.06_150)] text-[oklch(0.40_0.14_150)] dark:bg-[oklch(0.30_0.10_150)] dark:text-[oklch(0.88_0.10_150)]")
                  }
                >
                  {isView ? <Eye className="h-3 w-3" /> : <FilePlus className="h-3 w-3" />}
                  {isView ? (isZh ? "查看模式" : "View") : (isZh ? "新建模式" : "Create")}
                </span>
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{meta.date}</div>
            </div>
            <div className="hidden h-10 w-px bg-border sm:block" />

            {/* 2. New estimate button */}
            <button
              onClick={onNewEstimate}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> {isZh ? "新增报价单" : "New Estimate"}
            </button>
            <div className="hidden h-10 w-px bg-border sm:block" />

            {/* 3. Customer */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {isZh ? "客户" : "Customer"}
              </span>
              <CustomerPicker
                customers={customers}
                value={meta.customerId}
                valueLabel={meta.customerName}
                placeholder={isView ? (isZh ? "查看模式，无法选择" : "View mode — locked") : t("est.selectCustomer")}
                onSelect={applyCustomer}
                disabled={isView}
              />
              {selectedCustomer && (
                <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="font-mono">{selectedCustomer.phone}</span>
                  <span className="truncate">{selectedCustomer.address}, {selectedCustomer.city}</span>
                </div>
              )}
            </div>
            <div className="hidden h-10 w-px bg-border sm:block" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("est.quoteLanguage")}
              </span>
              <select
                value={meta.quoteLanguage}
                onChange={(e) => setMeta({ quoteLanguage: e.target.value as QuoteLanguage })}
                disabled={isView}
                className="rounded-md border border-input bg-card px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="en">{t("est.lang.en")}</option>
                <option value="zh">{t("est.lang.zh")}</option>
                <option value="bilingual">{t("est.lang.bilingual")}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              disabled={isView || !hasCustomer || lines.length === 0}
              title={isView ? (isZh ? "请先点击「新增报价单」" : "Click '+ New Estimate' first") : (lockReason || undefined)}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3.5 py-2 text-sm font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-4 w-4" /> {t("common.save")}
            </button>
            <button
              onClick={onPrint}
              disabled={!hasCustomer || lines.length === 0}
              title={lockReason || undefined}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3.5 py-2 text-sm font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Printer className="h-4 w-4" /> {isZh ? "打印报价" : "Print Estimate"}
            </button>
            <button
              onClick={onExport}
              disabled={!hasCustomer || lines.length === 0}
              title={lockReason || undefined}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" /> {t("est.exportPDF")}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Pane 1: Categories */}
        <div className="w-60 shrink-0 border-r border-border bg-card/40 overflow-y-auto finder-scroll">
          <div className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("est.trades")}
          </div>
          <div className="space-y-0.5 px-2 pb-3">
            {CATEGORIES.map((c) => {
              const Icon = (Icons as any)[c.icon] ?? Tag;
              const active = activeCat === c.id;
              const count = categoryItemCounts.get(c.id) ?? 0;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={
                    "group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors " +
                    (active
                      ? "bg-[oklch(0.95_0.04_240)] text-[oklch(0.40_0.18_240)] dark:bg-[oklch(0.30_0.10_240)] dark:text-[oklch(0.88_0.10_240)]"
                      : "text-foreground/85 hover:bg-secondary/70")
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium leading-tight">{c.name}</div>
                    {isZh && c.nameZh !== c.name && (
                      <div className={"truncate text-[11px] leading-tight " + (active ? "opacity-80" : "text-muted-foreground")}>
                        {c.nameZh}
                      </div>
                    )}
                  </div>
                  <span
                    className={
                      "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-mono " +
                      (active ? "bg-white/60 dark:bg-black/30" : "bg-secondary text-muted-foreground")
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pane 2: Items */}
        <div className="w-[360px] shrink-0 border-r border-border bg-card/20 flex flex-col">
          <div className="border-b border-border p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {isZh ? "项目" : "Items"}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={itemQ}
                onChange={(e) => setItemQ(e.target.value)}
                placeholder={t("est.searchItems")}
                className="w-full rounded-md border border-input bg-card py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto finder-scroll p-2 space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                className="group rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold leading-tight">{tItem(it, locale)}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-mono">{tUnit(it.unit, locale)}</span>
                      <span>{tPricing(it.defaultPricing, locale)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddItem(it)}
                    disabled={isView}
                    title={isView ? (isZh ? "请先点击「新增报价单」" : "Click '+ New Estimate' first") : undefined}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border/50 pt-2 text-[11px]">
                  <div>
                    <div className="text-muted-foreground">L</div>
                    <div className="font-mono">{fmt(it.laborRate)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">M</div>
                    <div className="font-mono">{fmt(it.materialRate)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{isZh ? "合计" : "Total"}</div>
                    <div className="font-mono font-semibold">{fmt(it.laborRate + it.materialRate)}</div>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">{t("est.noItems")}</div>
            )}
          </div>
        </div>

        {/* Pane 3: Estimate detail */}
        <div className="flex-1 flex flex-col bg-background min-w-0">
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {isZh ? "报价明细" : "Estimate Items"}
              </div>
              <div className="mt-0.5 text-sm font-medium">
                {lines.length} {lines.length === 1 ? "item" : "items"}
              </div>
            </div>
            {lines.length > 0 && !isView && (
              <button
                onClick={() => useEstimate.getState().clear()}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                {t("est.clearAll")}
              </button>
            )}
          </div>

          <div ref={linesScrollRef} className="flex-1 overflow-y-auto finder-scroll">
            {lines.length === 0 ? (
              <div className="flex h-full items-center justify-center p-10 text-center">
                <div className="max-w-xs">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.95_0.04_240)] text-[oklch(0.55_0.18_240)] dark:bg-[oklch(0.30_0.10_240)] dark:text-[oklch(0.85_0.10_240)]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="font-display text-base font-semibold">
                    {isView
                      ? (isZh ? "暂无报价单" : "No estimate to display")
                      : (isZh ? "尚未添加项目" : "No items added yet")}
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {isView
                      ? (isZh ? "点击上方「+ 新增报价单」开始创建。" : "Click '+ New Estimate' above to begin.")
                      : (isZh ? "选择左侧分类并点击 Add 来构建报价单。" : "Select a trade and click Add to build this estimate.")}
                  </div>
                  {isView ? (
                    <button
                      onClick={onNewEstimate}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                      <Plus className="h-4 w-4" /> {isZh ? "新增报价单" : "New Estimate"}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const first = PRICE_ITEMS.find((p) => p.categoryId === activeCat);
                        if (first) handleAddItem(first);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                      <Plus className="h-4 w-4" /> {isZh ? "添加第一个项目" : "Add first item"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 border-b border-border bg-card/95 text-left text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">{t("est.col.item")}</th>
                    <th className="px-2 py-2.5 font-medium">{t("est.col.pricing")}</th>
                    <th className="px-2 py-2.5 font-medium text-right">{t("est.col.qty")}</th>
                    <th className="px-2 py-2.5 font-medium">{t("est.col.unit")}</th>
                    <th className="px-2 py-2.5 font-medium text-right">{t("est.col.labor")}</th>
                    <th className="px-2 py-2.5 font-medium text-right">{t("est.col.material")}</th>
                    <th className="px-2 py-2.5 font-medium text-right">{t("est.col.disc")}</th>
                    <th className="px-3 py-2.5 font-medium text-right">{t("est.col.total")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => {
                    const cat = CATEGORIES.find((c) => c.id === l.categoryId);
                    const item = PRICE_ITEMS.find((p) => p.id === l.itemId);
                    return (
                      <tr key={l.id} className="border-b border-border/60 hover:bg-secondary/30">
                        <td className="px-3 py-2">
                          <div className="font-medium">{item ? tItem(item, locale) : l.itemName}</div>
                          <div className="text-[11px] text-muted-foreground">{cat ? tCategory(cat, locale) : l.categoryName}</div>
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={l.pricingType}
                            disabled={isView}
                            onChange={(e) => updateLine(l.id, { pricingType: e.target.value as PricingType })}
                            className="rounded border border-input bg-card px-1.5 py-1 text-xs outline-none disabled:opacity-60"
                          >
                            {PRICING_TYPES.map((p) => (
                              <option key={p} value={p}>{tPricing(p, locale)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number" min={0} step="0.01"
                            value={l.quantity}
                            disabled={isView}
                            onChange={(e) => updateLine(l.id, { quantity: Number(e.target.value) })}
                            className="w-20 rounded border border-input bg-card px-2 py-1 text-right text-xs outline-none disabled:opacity-60"
                          />
                        </td>
                        <td className="px-2 py-2 font-mono text-xs text-muted-foreground">{tUnit(l.unit, locale)}</td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number" min={0} step="0.01"
                            value={l.laborRate}
                            disabled={isView}
                            onChange={(e) => updateLine(l.id, { laborRate: Number(e.target.value) })}
                            className="w-20 rounded border border-input bg-card px-2 py-1 text-right text-xs outline-none disabled:opacity-60"
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number" min={0} step="0.01"
                            value={l.materialRate}
                            disabled={isView}
                            onChange={(e) => updateLine(l.id, { materialRate: Number(e.target.value) })}
                            className="w-20 rounded border border-input bg-card px-2 py-1 text-right text-xs outline-none disabled:opacity-60"
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number" min={0} step="0.01"
                            value={l.discount}
                            disabled={isView}
                            onChange={(e) => updateLine(l.id, { discount: Number(e.target.value) })}
                            className="w-20 rounded border border-input bg-card px-2 py-1 text-right text-xs outline-none disabled:opacity-60"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-medium">{fmt(lineTotal(l))}</td>
                        <td className="px-2 py-2">
                          {!isView && (
                            <button onClick={() => removeLine(l.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Summary card */}
          <div className="border-t border-border bg-card px-6 py-4">
            <div className="ml-auto max-w-md rounded-lg border border-border bg-[oklch(0.985_0.005_240)] p-4 shadow-sm dark:bg-secondary/40">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("est.subtotal")}</span>
                  <span className="font-mono">{fmt(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("est.lineDiscounts")}</span>
                  <span className="font-mono">− {fmt(totals.lineDiscounts)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{t("est.globalDiscount")}</span>
                  <input
                    type="number" min={0} step="1"
                    value={meta.globalDiscount}
                    disabled={isView}
                    onChange={(e) => setMeta({ globalDiscount: Number(e.target.value) })}
                    className="w-24 rounded border border-input bg-card px-2 py-1 text-right font-mono text-xs outline-none disabled:opacity-60"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <span className="font-display text-base font-semibold">{t("est.total")}</span>
                  <span className="font-display text-3xl font-semibold tracking-tight text-[oklch(0.45_0.18_240)] dark:text-[oklch(0.88_0.10_240)]">
                    {fmt(totals.total)}
                  </span>
                </div>
              </div>
            </div>
            {!hasCustomer && (
              <div className="mt-3 text-right text-xs text-muted-foreground">
                {isZh ? "请先选择客户后再保存或导出。" : "Please select a customer first to save or export."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// -------- Searchable customer picker --------

function CustomerPicker({
  customers,
  value,
  valueLabel,
  placeholder,
  onSelect,
  disabled,
}: {
  customers: Customer[];
  value: string | null;
  valueLabel: string;
  placeholder: string;
  onSelect: (c: Customer | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return customers.slice(0, 50);
    return customers
      .filter((c) =>
        [c.name, c.phone, c.email, c.city, c.address].join(" ").toLowerCase().includes(needle),
      )
      .slice(0, 50);
  }, [customers, q]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={
          "inline-flex min-w-[220px] items-center gap-2 rounded-md border border-input px-2.5 py-1.5 text-left text-sm outline-none focus:ring-2 focus:ring-ring/40 " +
          (disabled
            ? "cursor-not-allowed bg-secondary/60 text-muted-foreground opacity-70"
            : "bg-card hover:bg-secondary/60")
        }
      >
        <User className="h-3.5 w-3.5 text-muted-foreground" />
        <span className={value ? "truncate" : "text-muted-foreground truncate"}>
          {value && valueLabel ? valueLabel : placeholder}
        </span>
        <ChevronRight className="ml-auto h-3 w-3 rotate-90 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[320px] rounded-md border border-border bg-popover shadow-lg">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, phone, city…"
                className="w-full rounded border border-input bg-card py-1.5 pl-7 pr-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto finder-scroll">
            {value && (
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setOpen(false);
                  setQ("");
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary"
              >
                Clear selection
              </button>
            )}
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                No customers found.
              </div>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelect(c);
                  setOpen(false);
                  setQ("");
                }}
                className={
                  "block w-full border-b border-border/40 px-3 py-2 text-left text-sm hover:bg-secondary " +
                  (c.id === value ? "bg-secondary/60" : "")
                }
              >
                <div className="font-medium">{c.name}</div>
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{c.phone}</div>
                <div className="text-[11px] text-muted-foreground">{c.city}, {c.state}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -------- Shared print + PDF template (handles CJK natively) --------

interface PDFLabels {
  subtitle: string;
  estimate: string;
  date: string;
  validUntil: string;
  billTo: string;
  projectAddress: string;
  item: string;
  pricing: string;
  qty: string;
  unit: string;
  total: string;
  subtotal: string;
  discounts: string;
  totalRow: string;
  notes: string;
  terms: string;
  termsBody: string;
  footer: string;
  customerSig: string;
  companySig: string;
  signedDate: string;
  license: string;
  phone: string;
  email: string;
  web: string;
}

const LABELS_EN: PDFLabels = {
  subtitle: "Contractor Estimate",
  estimate: "Estimate #",
  date: "Date",
  validUntil: "Valid Until",
  billTo: "Bill To",
  projectAddress: "Project Address",
  item: "Item",
  pricing: "Pricing",
  qty: "Qty",
  unit: "Unit",
  total: "Total",
  subtotal: "Subtotal",
  discounts: "Discounts",
  totalRow: "Total Due",
  notes: "Notes",
  terms: "Terms & Conditions",
  termsBody:
    "Quote valid for 30 days from the date issued. Final pricing subject to on-site verification. A 30% deposit is required to schedule work. Change orders will be billed separately.",
  footer: "Thank you for the opportunity to provide this estimate.",
  customerSig: "Customer Signature",
  companySig: "Company Signature",
  signedDate: "Date",
  license: "License",
  phone: "Phone",
  email: "Email",
  web: "Web",
};
const LABELS_ZH: PDFLabels = {
  subtitle: "装修报价单",
  estimate: "报价编号",
  date: "日期",
  validUntil: "有效期至",
  billTo: "客户",
  projectAddress: "项目地址",
  item: "项目",
  pricing: "报价方式",
  qty: "数量",
  unit: "单位",
  total: "小计",
  subtotal: "小计",
  discounts: "折扣合计",
  totalRow: "应付总额",
  notes: "备注",
  terms: "条款说明",
  termsBody:
    "报价 30 天内有效，最终价格以现场核对为准。开工前需预付 30% 定金，工程变更将单独计费。",
  footer: "感谢您给予我们报价的机会。",
  customerSig: "客户签字",
  companySig: "公司签字",
  signedDate: "日期",
  license: "执照",
  phone: "电话",
  email: "邮箱",
  web: "网址",
};

function bi(en: string, zh: string, mode: QuoteLanguage): string {
  if (mode === "en") return en;
  if (mode === "zh") return zh;
  return `${en}<br/><span class="zh">${zh}</span>`;
}

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function exportPDF(
  meta: EstimateMeta,
  lines: EstimateLine[],
  totals: ReturnType<typeof estimateTotals>,
  company: CompanyProfile,
  customer: Customer | null,
  terms: { termsEn: string; termsZh: string },
  autoPrint: boolean,
) {
  const mode = meta.quoteLanguage;
  const L = mode === "zh" ? LABELS_ZH : LABELS_EN;
  const LZ = LABELS_ZH;

  const companyName = company.name?.trim() || "Your Company Name";
  // Derive an English/Latin display name. If the company name already contains
  // Latin letters, reuse it; otherwise fall back to a generic uppercase label.
  const hasLatin = /[A-Za-z]/.test(companyName);
  const companyNameEn = hasLatin
    ? companyName.toUpperCase()
    : "PROFESSIONAL REMODELING CONTRACTOR";
  const tagline =
    mode === "zh"
      ? "专业住宅与商业装修服务"
      : mode === "bilingual"
        ? "Professional Residential & Commercial Remodeling · 专业住宅与商业装修服务"
        : "Professional Residential & Commercial Remodeling";

  const lineRows = lines
    .map((l) => {
      const cat = CATEGORIES.find((c) => c.id === l.categoryId);
      const item = PRICE_ITEMS.find((p) => p.id === l.itemId);
      const nameEn = item?.name ?? l.itemName;
      const nameZh = item?.nameZh ?? nameEn;
      const catEn = cat?.name ?? l.categoryName;
      const catZh = cat?.nameZh ?? catEn;
      const pricingZh = tPricing(l.pricingType, "zh");
      const unitZh = tUnit(l.unit, "zh");
      return `
        <tr>
          <td>
            <div class="strong">${bi(esc(nameEn), esc(nameZh), mode)}</div>
            <div class="muted small">${bi(esc(catEn), esc(catZh), mode)}</div>
          </td>
          <td>${bi(esc(l.pricingType), esc(pricingZh), mode)}</td>
          <td class="right mono">${l.quantity}</td>
          <td class="mono">${bi(esc(l.unit), esc(unitZh), mode)}</td>
          <td class="right mono">${fmt(lineTotal(l))}</td>
        </tr>`;
    })
    .join("");

  const titleHeader =
    mode === "bilingual" ? `${L.subtitle} / ${LZ.subtitle}` : L.subtitle;

  const customerName = customer?.name || meta.customerName || "—";
  const customerPhone = customer?.phone || "";
  const customerEmail = customer?.email || "";
  const projectAddr = meta.projectAddress || "";
  const validUntil = meta.date ? formatDateAddDays(meta.date, 30) : "";

  const companyLines: string[] = [];
  if (company.address) companyLines.push(esc(company.address));
  const contact: string[] = [];
  if (company.phone) contact.push(`${L.phone}: ${esc(company.phone)}`);
  if (company.email) contact.push(`${L.email}: ${esc(company.email)}`);
  if (contact.length) companyLines.push(contact.join(" &nbsp;·&nbsp; "));
  if (company.website) companyLines.push(`${L.web}: ${esc(company.website)}`);
  if (company.license) companyLines.push(`${L.license}: ${esc(company.license)}`);

  const html = `<!doctype html>
<html lang="${mode === "zh" ? "zh-CN" : "en"}">
<head>
<meta charset="utf-8" />
<title>${esc(meta.estimateNumber)} — ${esc(companyName)}</title>
<style>
  @page { size: letter; margin: 0.5in; }
  * { box-sizing: border-box; }
  body {
    font-family: "Helvetica Neue", "Inter", "PingFang SC", "Hiragino Sans GB",
      "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", Arial, sans-serif;
    color: #1a1a1a; margin: 0; padding: 28px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  /* ===== Company header ===== */
  .head { display: flex; justify-content: space-between; align-items: center; gap: 28px; padding-bottom: 18px; border-bottom: 3px solid #0f2a4a; }
  .head .left { display: flex; align-items: center; gap: 18px; flex: 1; min-width: 0; }
  .logo { width: 84px; height: 84px; object-fit: contain; border-radius: 8px; background: #fff; padding: 4px; border: 1px solid #e5e7eb; flex: none; }
  .brand-cn { font-size: 34px; font-weight: 800; letter-spacing: -0.01em; line-height: 1.1; color: #0f2a4a; }
  .brand-en { font-size: 20px; font-weight: 700; letter-spacing: 0.04em; color: #1a1a1a; margin-top: 4px; text-transform: uppercase; }
  .tagline { font-size: 12px; color: #6b7280; margin-top: 6px; letter-spacing: 0.02em; }
  .contact { text-align: right; font-size: 11px; line-height: 1.7; color: #374151; flex: none; min-width: 200px; }
  .contact .row { white-space: nowrap; }
  .contact .lbl { color: #9ca3af; display: inline-block; min-width: 56px; text-align: left; }
  /* ===== Customer / project / estimate block ===== */
  .info-grid { display: grid; grid-template-columns: 1.1fr 1.9fr 1fr; gap: 0; margin: 20px 0 6px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
  .info-cell { padding: 14px 16px; font-size: 12px; border-right: 1px solid #e5e7eb; word-break: break-word; }
  .info-cell:last-child { border-right: 0; }
  .info-cell .blklabel { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #0f2a4a; font-weight: 700; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
  .info-cell .strong { font-size: 13px; font-weight: 700; color: #111; margin-bottom: 3px; }
  .info-cell .muted { color: #6b7280; font-size: 11px; line-height: 1.55; }
  .info-cell .estno { font-size: 15px; font-weight: 700; color: #0f2a4a; font-family: "JetBrains Mono", "SF Mono", Menlo, monospace; }
  /* ===== Line item table ===== */
  table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  thead th { background: #0f2a4a; color: #fff; text-align: left; padding: 10px 12px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
  thead th.right { text-align: right; }
  tbody td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 11.5px; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #fafbfc; }
  td.right, th.right { text-align: right; }
  .mono { font-family: "JetBrains Mono", "SF Mono", Menlo, monospace; }
  .strong { font-weight: 600; }
  .muted { color: #777; }
  .small { font-size: 10px; }
  .zh { color: #555; font-size: 0.92em; }
  /* ===== Totals ===== */
  .totals-wrap { display: flex; justify-content: flex-end; margin-top: 18px; }
  .totals { width: 340px; font-size: 12px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
  .totals .row { display: flex; justify-content: space-between; padding: 8px 14px; color: #4b5563; background: #fafbfc; }
  .totals .row + .row { border-top: 1px solid #eef0f3; }
  .totals .grand { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #0f2a4a; color: #fff; font-weight: 700; }
  .totals .grand .label { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; }
  .totals .grand .amt { font-size: 26px; letter-spacing: -0.01em; }
  /* ===== Terms / sigs / footer ===== */
  .terms { margin-top: 28px; page-break-inside: avoid; }
  .terms h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #0f2a4a; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 1.5px solid #0f2a4a; font-weight: 700; }
  .terms-body { font-size: 10.5px; line-height: 1.6; color: #333; white-space: pre-wrap; column-count: 2; column-gap: 24px; }
  .terms-zh { margin-top: 14px; padding-top: 12px; border-top: 1px dashed #ccc; }
  .sigs { margin-top: 32px; display: flex; gap: 32px; page-break-inside: avoid; }
  .sig { flex: 1; }
  .sig .blklabel { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0f2a4a; font-weight: 700; margin-bottom: 28px; }
  .sig .field { font-size: 10px; color: #555; margin-bottom: 14px; }
  .sig .field .lbl { display: inline-block; width: 90px; color: #888; }
  .sig .field .ink { display: inline-block; min-width: 180px; border-bottom: 1px solid #333; padding: 0 4px 2px; }
  .footer { margin-top: 30px; padding-top: 14px; border-top: 2px solid #0f2a4a; font-size: 10px; color: #6b7280; text-align: center; line-height: 1.7; }
  .footer .fbrand { color: #0f2a4a; font-weight: 700; font-size: 12px; letter-spacing: 0.02em; }
  @media print { .noprint { display: none !important; } }
  .bar { position: fixed; top: 10px; right: 10px; }
  .bar button { font-size: 12px; padding: 6px 12px; cursor: pointer; }
</style>
</head>
<body>
  <div class="bar noprint">
    <button onclick="window.print()">${mode === "zh" ? "打印 / 另存为 PDF" : "Print / Save as PDF"}</button>
  </div>

  <div class="head">
    <div class="left">
      ${company.logoUrl ? `<img class="logo" src="${esc(company.logoUrl)}" alt="logo" />` : ""}
      <div style="min-width:0;">
        <div class="brand-cn">${esc(companyName)}</div>
        <div class="brand-en">${esc(companyNameEn)}</div>
        <div class="tagline">${esc(tagline)}</div>
      </div>
    </div>
    <div class="contact">
      ${company.phone ? `<div class="row"><span class="lbl">${L.phone}</span> ${esc(company.phone)}</div>` : ""}
      ${company.email ? `<div class="row"><span class="lbl">${L.email}</span> ${esc(company.email)}</div>` : ""}
      ${company.website ? `<div class="row"><span class="lbl">${L.web}</span> ${esc(company.website)}</div>` : ""}
      ${company.license ? `<div class="row"><span class="lbl">${L.license} #</span> ${esc(company.license)}</div>` : ""}
      ${company.address ? `<div class="row" style="white-space:normal; margin-top:4px; color:#6b7280;">${esc(company.address)}</div>` : ""}
    </div>
  </div>

  <div class="info-grid">
    <div class="info-cell">
      <div class="blklabel">${bi(LABELS_EN.billTo, LZ.billTo, mode)}</div>
      <div class="strong">${esc(customerName)}</div>
      ${customerPhone ? `<div class="muted mono">${esc(customerPhone)}</div>` : ""}
      ${customerEmail ? `<div class="muted">${esc(customerEmail)}</div>` : ""}
    </div>
    <div class="info-cell" style="white-space:normal;">
      <div class="blklabel">${bi(LABELS_EN.projectAddress, LZ.projectAddress, mode)}</div>
      <div style="font-size:12.5px; color:#111; line-height:1.65;">${projectAddr ? esc(projectAddr).replace(/\n/g, "<br/>") : "—"}</div>
    </div>
    <div class="info-cell">
      <div class="blklabel">${bi("Estimate Info", "报价信息", mode)}</div>
      <div class="muted" style="margin-bottom:6px;">${bi(LABELS_EN.estimate, LZ.estimate, mode)}</div>
      <div class="estno">${esc(meta.estimateNumber)}</div>
      <div class="muted" style="margin-top:8px;">${bi(LABELS_EN.date, LZ.date, mode)}: <span style="color:#111;">${esc(meta.date)}</span></div>
      <div class="muted" style="margin-top:4px;">${bi(LABELS_EN.validUntil, LZ.validUntil, mode)}: <span style="color:#111;">${esc(validUntil)}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${bi(LABELS_EN.item, LZ.item, mode)}</th>
        <th>${bi(LABELS_EN.pricing, LZ.pricing, mode)}</th>
        <th class="right">${bi(LABELS_EN.qty, LZ.qty, mode)}</th>
        <th>${bi(LABELS_EN.unit, LZ.unit, mode)}</th>
        <th class="right">${bi(LABELS_EN.total, LZ.total, mode)}</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>

  <div class="totals-wrap">
    <div class="totals">
      <div class="row"><span>${bi(LABELS_EN.subtotal, LZ.subtotal, mode)}</span><span class="mono">${fmt(totals.subtotal)}</span></div>
      <div class="row"><span>${bi(LABELS_EN.discounts, LZ.discounts, mode)}</span><span class="mono">− ${fmt(totals.lineDiscounts + totals.globalDiscount)}</span></div>
      <div class="grand"><span class="label">${bi(LABELS_EN.totalRow, LZ.totalRow, mode)}</span><span class="amt mono">${fmt(totals.total)}</span></div>
    </div>
  </div>

  <div class="terms">
    <h3>${mode === "zh" ? "条款与条件 / Terms &amp; Conditions" : "Terms &amp; Conditions"}</h3>
    ${
      mode === "zh"
        ? `<div class="terms-body">${esc(terms.termsZh)}</div>`
        : mode === "bilingual"
          ? `<div class="terms-body">${esc(terms.termsEn)}</div>
             <div class="terms-body terms-zh">${esc(terms.termsZh)}</div>`
          : `<div class="terms-body">${esc(terms.termsEn)}</div>`
    }
  </div>

  <div class="sigs">
    <div class="sig">
      <div class="blklabel">${bi("Customer Acceptance", "客户确认", mode)}</div>
      <div class="field"><span class="lbl">${bi("Customer Name", "客户姓名", mode)}:</span> <span class="ink">&nbsp;</span></div>
      <div class="field"><span class="lbl">${bi("Signature", "客户签字", mode)}:</span> <span class="ink">&nbsp;</span></div>
      <div class="field"><span class="lbl">${bi("Date", "日期", mode)}:</span> <span class="ink">&nbsp;</span></div>
    </div>
    <div class="sig">
      <div class="blklabel">${bi("Contractor Acceptance", "承包商确认", mode)}</div>
      <div class="field"><span class="lbl">${bi("Company Name", "公司名称", mode)}:</span> <span class="ink">${esc(companyName)}</span></div>
      <div class="field"><span class="lbl">${bi("Signature", "承包商签字", mode)}:</span> <span class="ink">&nbsp;</span></div>
      <div class="field"><span class="lbl">${bi("Date", "日期", mode)}:</span> <span class="ink">&nbsp;</span></div>
    </div>
  </div>

  <div class="footer">
    <div class="fbrand">${esc(companyName)}${companyNameEn ? ` · ${esc(companyNameEn)}` : ""}</div>
    <div>${[
      company.license ? `${L.license} #${esc(company.license)}` : "",
      company.phone ? `${L.phone}: ${esc(company.phone)}` : "",
      company.website ? esc(company.website) : "",
    ].filter(Boolean).join(" &nbsp;·&nbsp; ")}</div>
    <div style="margin-top:4px;">${esc(titleHeader)}</div>
  </div>


  ${autoPrint ? `<script>window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 350); });</script>` : ""}
</body>
</html>`;

  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) {
    alert("Please allow pop-ups to print or export the PDF.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

