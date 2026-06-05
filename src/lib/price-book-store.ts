import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PRICE_ITEMS, type PriceItem } from "./data";

interface PriceBookState {
  overrides: Record<string, Partial<PriceItem>>;
  customItems: PriceItem[];
  updateItem: (id: string, patch: Partial<PriceItem>) => void;
  addItem: (item: Omit<PriceItem, "id"> & { id?: string }) => PriceItem;
  upsertMany: (
    rows: Array<Omit<PriceItem, "id"> & { id?: string }>,
  ) => { created: number; updated: number };
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
        let created = 0;
        let updated = 0;
        const state = get();
        const all: PriceItem[] = [
          ...PRICE_ITEMS.map((i) => ({ ...i, ...(state.overrides[i.id] ?? {}) })),
          ...state.customItems,
        ];
        const keyOf = (i: { categoryId: string; name: string; unit: string }) =>
          `${i.categoryId}__${i.name.trim().toLowerCase()}__${i.unit.trim().toLowerCase()}`;
        const byKey = new Map(all.map((i) => [keyOf(i), i] as const));

        const newOverrides = { ...state.overrides };
        const newCustoms = [...state.customItems];

        for (const row of rows) {
          const existing = byKey.get(keyOf(row));
          if (existing) {
            const patch: Partial<PriceItem> = {
              nameZh: row.nameZh,
              defaultPricing: row.defaultPricing,
              laborRate: row.laborRate,
              materialRate: row.materialRate,
              notes: row.notes,
            };
            const ci = newCustoms.findIndex((c) => c.id === existing.id);
            if (ci >= 0) {
              newCustoms[ci] = { ...newCustoms[ci], ...patch };
            } else {
              newOverrides[existing.id] = { ...newOverrides[existing.id], ...patch };
            }
            updated++;
          } else {
            const item: PriceItem = {
              hoursPerUnit: 0,
              ...row,
              id: row.id ?? makeId(row.categoryId),
            } as PriceItem;
            newCustoms.unshift(item);
            byKey.set(keyOf(item), item);
            created++;
          }
        }
        set({ overrides: newOverrides, customItems: newCustoms });
        return { created, updated };
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
