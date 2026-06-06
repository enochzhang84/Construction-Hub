import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PRICE_ITEMS, type PriceItem } from "./data";

interface PriceBookState {
  overrides: Record<string, Partial<PriceItem>>;
  customItems: PriceItem[];
  updateItem: (id: string, patch: Partial<PriceItem>) => void;
  addItem: (item: Partial<PriceItem> & Pick<PriceItem, "categoryId" | "name" | "unit" | "defaultPricing" | "laborRate" | "materialRate">) => PriceItem;
  upsertMany: (
    rows: Array<Partial<PriceItem> & Pick<PriceItem, "categoryId" | "name" | "unit" | "defaultPricing" | "laborRate" | "materialRate">>,
  ) => { created: number; skipped: number };
  reset: () => void;
}

function makeId(categoryId: string) {
  return `custom-${categoryId}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export const usePriceBookStore = create<PriceBookState>()(
  persist(
    (set, get) => ({
      overrides: {},
      customItems: [],
      updateItem: (id, patch) =>
        set((s) => {
          // Custom items: update in place
          const idx = s.customItems.findIndex((c) => c.id === id);
          if (idx >= 0) {
            const next = [...s.customItems];
            next[idx] = { ...next[idx], ...patch } as PriceItem;
            return { customItems: next };
          }
          return { overrides: { ...s.overrides, [id]: { ...s.overrides[id], ...patch } } };
        }),
      addItem: (item) => {
        const created: PriceItem = {
          ...item,
          hoursPerUnit: item.hoursPerUnit ?? 0,
          id: item.id ?? makeId(item.categoryId),
        } as PriceItem;
        set((s) => ({ customItems: [created, ...s.customItems] }));
        return created;
      },
      upsertMany: (rows) => {
        // Per requirement: never overwrite existing items — skip duplicates,
        // only insert new ones. Duplicate key: categoryId + name + nameZh + unit.
        let created = 0;
        let skipped = 0;
        const state = get();
        const all: PriceItem[] = [
          ...PRICE_ITEMS.map((i) => ({ ...i, ...(state.overrides[i.id] ?? {}) })),
          ...state.customItems,
        ];
        const keyOf = (i: { categoryId: string; name: string; unit: string; nameZh?: string }) =>
          `${i.categoryId}__${(i.name ?? "").trim().toLowerCase()}__${(i.nameZh ?? "").trim().toLowerCase()}__${(i.unit ?? "").trim().toLowerCase()}`;
        const keys = new Set(all.map((i) => keyOf(i)));

        const newCustoms = [...state.customItems];
        for (const row of rows) {
          const k = keyOf(row as PriceItem);
          if (keys.has(k)) {
            skipped++;
            continue;
          }
          const item: PriceItem = {
            ...row,
            hoursPerUnit: row.hoursPerUnit ?? 0,
            id: row.id ?? makeId(row.categoryId),
          } as PriceItem;
          newCustoms.unshift(item);
          keys.add(k);
          created++;
        }
        set({ customItems: newCustoms });
        return { created, skipped };
      },
      reset: () => set({ overrides: {}, customItems: [] }),
    }),
    { name: "construction-hub-pricebook" },
  ),
);

export function useMergedPriceItems(): PriceItem[] {
  const overrides = usePriceBookStore((s) => s.overrides);
  const customItems = usePriceBookStore((s) => s.customItems);
  return [
    ...PRICE_ITEMS.map((i) => ({ ...i, ...(overrides[i.id] ?? {}) })),
    ...customItems,
  ];
}
