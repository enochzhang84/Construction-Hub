import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  categoryEn?: string;
  categoryZh?: string;
  commonMaterials?: string;
  paymentMethod?: string;
  paymentTerms?: string;
  account?: string;
  notes?: string;
  isArchived?: boolean;
  createdAt: string;
}

const SEED: Supplier[] = [
  { id: "sup-1", name: "Home Depot Pro", categoryEn: "General", categoryZh: "综合", account: "HD-PRO-8842", paymentTerms: "Net 30", phone: "(800) 466-3337", email: "pro@homedepot.com", city: "Atlanta", state: "GA", createdAt: "2025-01-10" },
  { id: "sup-2", name: "Floor & Decor", categoryEn: "Flooring & Tile", categoryZh: "地板与瓷砖", account: "FD-2210", paymentTerms: "COD", phone: "(877) 675-0002", city: "Smyrna", state: "GA", createdAt: "2025-01-12" },
  { id: "sup-3", name: "Ferguson", categoryEn: "Plumbing", categoryZh: "水暖", account: "FRG-9921", paymentTerms: "Net 30", phone: "(888) 334-0004", city: "Newport News", state: "VA", createdAt: "2025-01-14" },
  { id: "sup-4", name: "Rexel", categoryEn: "Electrical", categoryZh: "电气", account: "RX-4451", paymentTerms: "Net 30", phone: "(800) 73-9355", city: "Dallas", state: "TX", createdAt: "2025-01-16" },
  { id: "sup-5", name: "Dunn-Edwards", categoryEn: "Paint", categoryZh: "油漆", account: "DE-PRO-115", paymentTerms: "Net 15", phone: "(888) 337-2468", city: "Los Angeles", state: "CA", createdAt: "2025-01-18" },
];

interface SupplierState {
  suppliers: Supplier[];
  addSupplier: (s: Omit<Supplier, "id" | "createdAt">) => Supplier;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  removeSupplier: (id: string) => void;
  setArchived: (id: string, archived: boolean) => void;
}

export const useSuppliers = create<SupplierState>()(
  persist(
    (set) => ({
      suppliers: SEED,
      addSupplier: (s) => {
        const newS: Supplier = {
          ...s,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set((st) => ({ suppliers: [newS, ...st.suppliers] }));
        return newS;
      },
      updateSupplier: (id, patch) =>
        set((st) => ({
          suppliers: st.suppliers.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeSupplier: (id) =>
        set((st) => ({ suppliers: st.suppliers.filter((x) => x.id !== id) })),
      setArchived: (id, archived) =>
        set((st) => ({
          suppliers: st.suppliers.map((x) => (x.id === id ? { ...x, isArchived: archived } : x)),
        })),
    }),
    { name: "construction-hub-suppliers" },
  ),
);
