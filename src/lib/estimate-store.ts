import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PricingType } from "./data";
import { nextEstimateNumber } from "./estimate-number";

export interface EstimateLine {
  id: string;
  categoryId: string;
  categoryName: string;
  itemId: string;
  itemName: string;
  unit: string;
  pricingType: PricingType;
  quantity: number;
  hoursPerUnit: number;
  laborRate: number;
  materialRate: number;
  discount: number; // dollar amount off
  notes?: string;
}

export interface EstimateMeta {
  customerId: string | null;
  customerName: string;
  projectAddress: string;
  estimateNumber: string;
  date: string;
  globalDiscount: number;
  quoteLanguage: "en" | "zh" | "bilingual";
}

interface EstimateState {
  meta: EstimateMeta;
  lines: EstimateLine[];
  addLine: (line: Omit<EstimateLine, "id">) => void;
  updateLine: (id: string, patch: Partial<EstimateLine>) => void;
  removeLine: (id: string) => void;
  setMeta: (patch: Partial<EstimateMeta>) => void;
  clear: () => void;
}

const initialMeta: EstimateMeta = {
  customerId: null,
  customerName: "",
  projectAddress: "",
  estimateNumber: `EST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
  date: new Date().toISOString().slice(0, 10),
  globalDiscount: 0,
  quoteLanguage: "en",
};

export const useEstimate = create<EstimateState>()(
  persist(
    (set) => ({
      meta: initialMeta,
      lines: [],
      addLine: (line) =>
        set((s) => ({ lines: [...s.lines, { ...line, id: crypto.randomUUID() }] })),
      updateLine: (id, patch) =>
        set((s) => ({ lines: s.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      removeLine: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      setMeta: (patch) => set((s) => ({ meta: { ...s.meta, ...patch } })),
      clear: () =>
        set({
          lines: [],
          meta: { ...initialMeta, estimateNumber: `EST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}` },
        }),
    }),
    { name: "construction-hub-estimate" },
  ),
);

export function lineTotal(l: EstimateLine): number {
  let base = 0;
  switch (l.pricingType) {
    case "Labor Only":
      base = l.quantity * l.hoursPerUnit * l.laborRate;
      // If laborRate already a per-unit rate (most seed data), prefer per-unit calc:
      base = l.quantity * l.laborRate;
      break;
    case "Customer Supplied Material":
      base = l.quantity * l.laborRate;
      break;
    case "Labor + Material":
    case "Turnkey":
      base = l.quantity * (l.laborRate + l.materialRate);
      break;
    case "Estimate":
    case "Custom":
      base = l.quantity * (l.laborRate + l.materialRate);
      break;
  }
  return Math.max(0, base - l.discount);
}

export function estimateTotals(lines: EstimateLine[], globalDiscount: number) {
  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l) + l.discount, 0);
  const lineDiscounts = lines.reduce((sum, l) => sum + l.discount, 0);
  const afterLines = subtotal - lineDiscounts;
  const total = Math.max(0, afterLines - globalDiscount);
  return { subtotal, lineDiscounts, globalDiscount, total };
}
