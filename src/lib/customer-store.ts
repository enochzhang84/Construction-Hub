import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SEED_CUSTOMERS, type Customer } from "./data";

interface CustomerState {
  customers: Customer[];
  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
}

export const useCustomers = create<CustomerState>()(
  persist(
    (set) => ({
      customers: SEED_CUSTOMERS,
      addCustomer: (c) => {
        const newC: Customer = {
          ...c,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set((s) => ({ customers: [newC, ...s.customers] }));
        return newC;
      },
      updateCustomer: (id, patch) =>
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeCustomer: (id) =>
        set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),
    }),
    { name: "construction-hub-customers" },
  ),
);
