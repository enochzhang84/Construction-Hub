// System-Data utilities — backs the Settings → System Data panel.
// Read/write the seven catalog tables in Supabase and (re)generate
// the schema + seed SQL files used for VPS / fresh-Supabase deployment.

import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, PRICE_ITEMS, type PriceItem } from "./data";

export type CatalogTable =
  | "categories"
  | "units"
  | "pricing_types"
  | "construction_items"
  | "terms_conditions"
  | "pdf_templates"
  | "system_settings";

export const CATALOG_TABLES: CatalogTable[] = [
  "categories",
  "units",
  "pricing_types",
  "construction_items",
  "terms_conditions",
  "pdf_templates",
  "system_settings",
];

export type CatalogCounts = Record<CatalogTable, number>;

/** Count rows in every catalog table in parallel. */
export async function getCatalogCounts(): Promise<CatalogCounts> {
  const entries = await Promise.all(
    CATALOG_TABLES.map(async (t) => {
      const { count, error } = await supabase
        .from(t)
        .select("*", { count: "exact", head: true });
      if (error) throw new Error(`${t}: ${error.message}`);
      return [t, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(entries) as CatalogCounts;
}

/** SQL string escaper for single-quoted literals. */
const esc = (s: unknown) => String(s ?? "").replace(/'/g, "''");

/** Render a JSONB literal safely. */
const jsonLit = (v: unknown) => `'${esc(JSON.stringify(v))}'::jsonb`;

/**
 * Regenerate construction_seed_data.sql from the current Supabase rows.
 * Customer / estimate tables are intentionally excluded.
 */
export async function exportSeedSql(): Promise<string> {
  const [
    { data: cats, error: e1 },
    { data: units, error: e2 },
    { data: ptypes, error: e3 },
    { data: items, error: e4 },
    { data: terms, error: e5 },
    { data: tpls, error: e6 },
    { data: settings, error: e7 },
  ] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("units").select("*").order("sort_order"),
    supabase.from("pricing_types").select("*").order("sort_order"),
    supabase.from("construction_items").select("*").order("category_id").order("id"),
    supabase.from("terms_conditions").select("*").order("sort_order"),
    supabase.from("pdf_templates").select("*"),
    supabase.from("system_settings").select("*").order("key"),
  ]);
  const err = [e1, e2, e3, e4, e5, e6, e7].find(Boolean);
  if (err) throw new Error(err.message);

  let out = `-- ============================================================\n`;
  out += `-- Construction Library — seed data (regenerated from live DB)\n`;
  out += `-- Generated: ${new Date().toISOString()}\n`;
  out += `-- Run AFTER construction_schema.sql on a fresh Supabase project.\n`;
  out += `-- ============================================================\n\n`;

  out += `-- Units (${units?.length ?? 0})\n`;
  for (const u of units ?? []) {
    out += `INSERT INTO public.units(code,label_en,label_zh,sort_order) VALUES ('${esc(u.code)}','${esc(u.label_en)}','${esc(u.label_zh)}',${u.sort_order ?? 0}) ON CONFLICT (code) DO NOTHING;\n`;
  }
  out += `\n-- Pricing Types (${ptypes?.length ?? 0})\n`;
  for (const p of ptypes ?? []) {
    out += `INSERT INTO public.pricing_types(code,label_en,label_zh,sort_order) VALUES ('${esc(p.code)}','${esc(p.label_en)}','${esc(p.label_zh)}',${p.sort_order ?? 0}) ON CONFLICT (code) DO NOTHING;\n`;
  }
  out += `\n-- Categories (${cats?.length ?? 0})\n`;
  for (const c of cats ?? []) {
    out += `INSERT INTO public.categories(id,name_en,name_zh,icon,sort_order) VALUES ('${esc(c.id)}','${esc(c.name_en)}','${esc(c.name_zh)}','${esc(c.icon)}',${c.sort_order ?? 0}) ON CONFLICT (id) DO NOTHING;\n`;
  }
  out += `\n-- Construction Items (${items?.length ?? 0})\n`;
  for (const i of items ?? []) {
    out += `INSERT INTO public.construction_items(id,category_id,name_en,name_zh,unit,default_pricing,labor_rate,material_rate,hours_per_unit) VALUES ('${esc(i.id)}','${esc(i.category_id)}','${esc(i.name_en)}','${esc(i.name_zh)}','${esc(i.unit)}','${esc(i.default_pricing)}',${Number(i.labor_rate) || 0},${Number(i.material_rate) || 0},${Number(i.hours_per_unit) || 0}) ON CONFLICT (id) DO NOTHING;\n`;
  }
  out += `\n-- Terms & Conditions (${terms?.length ?? 0})\n`;
  for (const t of terms ?? []) {
    out += `INSERT INTO public.terms_conditions(title,body,locale,is_default,sort_order) VALUES ('${esc(t.title)}','${esc(t.body)}','${esc(t.locale)}',${t.is_default ? "true" : "false"},${t.sort_order ?? 0}) ON CONFLICT DO NOTHING;\n`;
  }
  out += `\n-- PDF Templates (${tpls?.length ?? 0})\n`;
  for (const tp of tpls ?? []) {
    out += `INSERT INTO public.pdf_templates(name,description,config,is_default) VALUES ('${esc(tp.name)}','${esc(tp.description ?? "")}',${jsonLit(tp.config ?? {})},${tp.is_default ? "true" : "false"}) ON CONFLICT DO NOTHING;\n`;
  }
  out += `\n-- System Settings (${settings?.length ?? 0})\n`;
  for (const s of settings ?? []) {
    out += `INSERT INTO public.system_settings(key,value,description) VALUES ('${esc(s.key)}',${jsonLit(s.value)},'${esc(s.description ?? "")}') ON CONFLICT (key) DO NOTHING;\n`;
  }
  return out;
}

/** Trigger a browser download of arbitrary text. */
export function downloadText(filename: string, text: string, mime = "application/sql") {
  const blob = new Blob([text], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Fetch the static schema SQL bundled with the deployment. */
export async function fetchSchemaSql(): Promise<string> {
  const res = await fetch("/exports/construction_schema.sql");
  if (!res.ok) throw new Error(`Schema file not found (HTTP ${res.status})`);
  return res.text();
}

/**
 * Build the V2 catalog rows from `src/lib/data.ts` (the seed source of truth).
 * Used by Restore Default + Initialize Default.
 */
function buildSeedItems(): Array<Pick<PriceItem, "id" | "categoryId" | "name" | "nameZh" | "unit" | "defaultPricing" | "laborRate" | "materialRate" | "hoursPerUnit">> {
  return PRICE_ITEMS.map((i) => ({
    id: i.id,
    categoryId: i.categoryId,
    name: i.name,
    nameZh: i.nameZh ?? i.name,
    unit: i.unit,
    defaultPricing: i.defaultPricing,
    laborRate: i.laborRate,
    materialRate: i.materialRate,
    hoursPerUnit: i.hoursPerUnit,
  }));
}

const dedupKey = (cat: string, name: string, zh: string, unit: string) =>
  `${cat}__${name.trim().toLowerCase()}__${zh.trim().toLowerCase()}__${unit.trim().toLowerCase()}`;

/**
 * Restore Default Construction Items — upserts the V2 seed.
 * Skips rows whose (category, name_en, name_zh, unit) already exist.
 * NEVER overwrites existing prices.
 * Returns { created, skipped }.
 */
export async function restoreDefaultConstructionItems(): Promise<{
  created: number;
  skipped: number;
}> {
  // 1. Ensure categories exist (insert missing ones first)
  const { data: existingCats } = await supabase.from("categories").select("id");
  const haveCatIds = new Set((existingCats ?? []).map((c) => c.id));
  const missingCats = CATEGORIES.filter((c) => !haveCatIds.has(c.id)).map((c, i) => ({
    id: c.id,
    name_en: c.name,
    name_zh: c.nameZh,
    icon: c.icon,
    sort_order: 1000 + i,
  }));
  if (missingCats.length) {
    const { error } = await supabase.from("categories").insert(missingCats);
    if (error) throw new Error(`categories: ${error.message}`);
  }

  // 2. Fetch existing items to compute dedup keys
  const { data: existing, error: e } = await supabase
    .from("construction_items")
    .select("category_id,name_en,name_zh,unit");
  if (e) throw new Error(`construction_items read: ${e.message}`);
  const seen = new Set(
    (existing ?? []).map((r) => dedupKey(r.category_id, r.name_en, r.name_zh ?? "", r.unit)),
  );

  // 3. Filter seed → only new rows
  const seed = buildSeedItems();
  type ItemInsert = {
    id: string;
    category_id: string;
    name_en: string;
    name_zh: string;
    unit: string;
    default_pricing: string;
    labor_rate: number;
    material_rate: number;
    hours_per_unit: number;
  };
  const toInsert: ItemInsert[] = [];
  let skipped = 0;
  for (const r of seed) {
    const k = dedupKey(r.categoryId, r.name, r.nameZh ?? "", r.unit);
    if (seen.has(k)) {
      skipped++;
      continue;
    }
    seen.add(k);
    toInsert.push({
      id: r.id,
      category_id: r.categoryId,
      name_en: r.name,
      name_zh: r.nameZh ?? "",
      unit: r.unit,
      default_pricing: r.defaultPricing,
      labor_rate: r.laborRate,
      material_rate: r.materialRate,
      hours_per_unit: r.hoursPerUnit ?? 0,
    });
  }

  // 4. Batch insert (500 row chunks)
  let created = 0;
  for (let i = 0; i < toInsert.length; i += 500) {
    const chunk = toInsert.slice(i, i + 500);
    const { error: ie } = await supabase.from("construction_items").insert(chunk);
    if (ie) throw new Error(`construction_items insert: ${ie.message}`);
    created += chunk.length;
  }
  return { created, skipped };
}

/**
 * Initialize Default Data — only runs when target tables are empty.
 * Seeds units, pricing types, categories, items, default terms,
 * default PDF template, baseline settings.
 */
export async function initializeDefaultData(): Promise<{
  initialized: boolean;
  reason?: string;
  counts?: CatalogCounts;
}> {
  const counts = await getCatalogCounts();
  const nonEmpty = CATALOG_TABLES.filter((t) => counts[t] > 0);
  if (nonEmpty.length > 0) {
    return { initialized: false, reason: `Already initialized (${nonEmpty.join(", ")})`, counts };
  }

  // units
  await supabase.from("units").insert([
    { code: "sqft", label_en: "Square Foot", label_zh: "平方英尺", sort_order: 1 },
    { code: "lf", label_en: "Linear Foot", label_zh: "线性英尺", sort_order: 2 },
    { code: "ea", label_en: "Each", label_zh: "个", sort_order: 3 },
    { code: "sq", label_en: "Square (100 sqft)", label_zh: "百平方英尺", sort_order: 4 },
    { code: "job", label_en: "Job", label_zh: "项", sort_order: 5 },
    { code: "hr", label_en: "Hour", label_zh: "小时", sort_order: 6 },
  ]);

  // pricing types
  await supabase.from("pricing_types").insert([
    { code: "Labor Only", label_en: "Labor Only", label_zh: "仅人工", sort_order: 1 },
    { code: "Labor + Material", label_en: "Labor + Material", label_zh: "人工+材料", sort_order: 2 },
    { code: "Customer Supplied Material", label_en: "Customer Supplied Material", label_zh: "客户提供材料", sort_order: 3 },
    { code: "Turnkey", label_en: "Turnkey", label_zh: "整包", sort_order: 4 },
    { code: "Estimate", label_en: "Estimate", label_zh: "估价", sort_order: 5 },
    { code: "Custom", label_en: "Custom", label_zh: "自定义", sort_order: 6 },
  ]);

  // categories
  await supabase.from("categories").insert(
    CATEGORIES.map((c, i) => ({
      id: c.id,
      name_en: c.name,
      name_zh: c.nameZh,
      icon: c.icon,
      sort_order: i + 1,
    })),
  );

  // construction items (full V2 seed)
  const seed = buildSeedItems().map((r) => ({
    id: r.id,
    category_id: r.categoryId,
    name_en: r.name,
    name_zh: r.nameZh ?? "",
    unit: r.unit,
    default_pricing: r.defaultPricing,
    labor_rate: r.laborRate,
    material_rate: r.materialRate,
    hours_per_unit: r.hoursPerUnit ?? 0,
  }));
  for (let i = 0; i < seed.length; i += 500) {
    await supabase.from("construction_items").insert(seed.slice(i, i + 500));
  }

  // default terms
  await supabase.from("terms_conditions").insert([
    {
      title: "Standard Terms",
      body: "This estimate is valid for 30 days from the date of issue. Prices are subject to change based on final material selections and site conditions. A signed contract and deposit are required to schedule work. Any changes to the scope of work will be documented as a change order.",
      locale: "en",
      is_default: true,
      sort_order: 1,
    },
    {
      title: "标准条款",
      body: "此报价单自签发之日起30天内有效。最终价格可能因材料选择及现场情况而调整。开工前需签订正式合同并支付定金。任何工程范围变更将以书面变更单形式确认。",
      locale: "zh",
      is_default: true,
      sort_order: 2,
    },
  ]);

  // default PDF template
  await supabase.from("pdf_templates").insert({
    name: "Standard Estimate",
    description: "Default bilingual estimate template",
    config: {
      header: { showLogo: true, showCompany: true },
      footer: { showLicense: true, showWebsite: true },
      columns: ["description", "qty", "unit", "price", "amount"],
      locale: "en",
    },
    is_default: true,
  });

  // baseline settings
  await supabase.from("system_settings").insert([
    { key: "default_currency", value: "USD", description: "Default currency" },
    { key: "default_locale", value: "en", description: "Default locale (en|zh)" },
    { key: "default_tax_rate", value: "0", description: "Default sales tax rate (percent)" },
    { key: "estimate_valid_days", value: 30, description: "Estimate validity period in days" },
    { key: "estimate_number_prefix", value: "EST-", description: "Prefix for auto-generated estimate numbers" },
  ]);

  return { initialized: true, counts: await getCatalogCounts() };
}
