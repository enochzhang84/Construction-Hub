import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PRICE_ITEMS, type PriceItem } from "./data";

interface PriceBookState {
  overrides: Record<string, Partial<PriceItem>>;
  updateItem: (id: string, patch: Partial<PriceItem>) => void;
  reset: () => void;
}

export const usePriceBookStore = create<PriceBookState>()(
  persist(
    (set) => ({
      overrides: {},
      updateItem: (id, patch) =>
        set((s) => ({ overrides: { ...s.overrides, [id]: { ...s.overrides[id], ...patch } } })),
      reset: () => set({ overrides: {} }),
    }),
    { name: "construction-hub-pricebook" },
  ),
);

export function useMergedPriceItems(): PriceItem[] {
  const overrides = usePriceBookStore((s) => s.overrides);
  return PRICE_ITEMS.map((i) => ({ ...i, ...(overrides[i.id] ?? {}) }));
}
