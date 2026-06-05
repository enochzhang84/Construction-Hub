import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProjectStatus =
  | "Estimate"
  | "Active"
  | "Pending Payment"
  | "Completed"
  | "Cancelled";

export type PaymentMethod =
  | "Cash"
  | "Check"
  | "Bank Transfer"
  | "Zelle"
  | "Credit Card"
  | "Other";

export interface ProjectLineItem {
  id: string;
  categoryName?: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  amount: number; // qty * unitPrice
}

export interface Project {
  id: string;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string;
  projectAddress: string;
  estimateNumber: string;
  amount: number;
  discount?: number;
  paidAmount: number;
  estimateDate: string;
  issueDate?: string;
  startDate?: string;
  expectedEndDate?: string;
  settlementDate?: string;
  paymentMethod?: PaymentMethod;
  status: ProjectStatus;
  subStatus: string;
  notes?: string;
  lineItems?: ProjectLineItem[];
  // Add-on linkage
  parentProjectId?: string;
  addonNumber?: string;
}

interface ProjectsState {
  projects: Project[];
  add: (p: Omit<Project, "id">) => Project;
  update: (id: string, patch: Partial<Project>) => void;
  remove: (id: string) => void;
  setStatus: (id: string, status: ProjectStatus, subStatus?: string) => void;
  upsertByEstimateNumber: (p: Omit<Project, "id">) => Project;
}

// Estimates / projects / payments are business data — no seed records.
const SEED: Project[] = [];

export const useProjects = create<ProjectsState>()(
  persist(
    (set) => ({
      projects: SEED,
      add: (p) => {
        const newP: Project = { ...p, id: crypto.randomUUID() };
        set((s) => ({ projects: [newP, ...s.projects] }));
        return newP;
      },
      update: (id, patch) =>
        set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      remove: (id) => set((s) => ({ projects: s.projects.filter((x) => x.id !== id) })),
      setStatus: (id, status, subStatus) =>
        set((s) => ({
          projects: s.projects.map((x) =>
            x.id === id ? { ...x, status, subStatus: subStatus ?? x.subStatus } : x,
          ),
        })),
      upsertByEstimateNumber: (p) => {
        let result: Project | null = null;
        set((s) => {
          const idx = s.projects.findIndex((x) => x.estimateNumber === p.estimateNumber);
          if (idx >= 0) {
            const existing = s.projects[idx];
            const merged: Project = { ...existing, ...p, id: existing.id };
            result = merged;
            const next = s.projects.slice();
            next[idx] = merged;
            return { projects: next };
          }
          const created: Project = { ...p, id: crypto.randomUUID() };
          result = created;
          return { projects: [created, ...s.projects] };
        });
        return result!;
      },
    }),
    { name: "construction-hub-projects.v3" },
  ),
);

export function summarizeProjects(projects: Project[]) {
  const visible = projects.filter((p) => p.status !== "Cancelled");
  const estimates = visible.filter((p) => p.status === "Estimate");
  const active = visible.filter((p) => p.status === "Active");
  const pending = visible.filter((p) => p.status === "Pending Payment");
  const completed = visible.filter((p) => p.status === "Completed");
  const sum = (arr: Project[], k: keyof Project) =>
    arr.reduce((acc, x) => acc + (Number(x[k]) || 0), 0);
  return {
    estimates,
    active,
    pending,
    completed,
    estimateTotal: sum(estimates, "amount"),
    contractTotal: sum(active, "amount"),
    pendingDue: pending.reduce((acc, x) => acc + (x.amount - x.paidAmount), 0),
  };
}

// ---------- helpers ----------

export function formatDMY(isoDate?: string | null): string {
  if (!isoDate) return "—";
  // Parse YYYY-MM-DD literally to avoid timezone shifts (SSR/client mismatch).
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!m) return "—";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export const STATUS_OPTIONS: ProjectStatus[] = [
  "Estimate",
  "Active",
  "Pending Payment",
  "Completed",
  "Cancelled",
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Check",
  "Bank Transfer",
  "Zelle",
  "Credit Card",
  "Other",
];

export function statusBadgeClass(s: ProjectStatus): string {
  switch (s) {
    case "Estimate":
      return "bg-[oklch(0.95_0.04_240)] text-[oklch(0.40_0.18_240)] dark:bg-[oklch(0.30_0.10_240)] dark:text-[oklch(0.85_0.10_240)]";
    case "Active":
      return "bg-[oklch(0.95_0.06_55)] text-[oklch(0.48_0.16_50)] dark:bg-[oklch(0.32_0.10_55)] dark:text-[oklch(0.88_0.10_55)]";
    case "Pending Payment":
      return "bg-[oklch(0.94_0.06_150)] text-[oklch(0.40_0.14_150)] dark:bg-[oklch(0.30_0.10_150)] dark:text-[oklch(0.88_0.10_150)]";
    case "Completed":
      return "bg-secondary text-muted-foreground";
    case "Cancelled":
      return "bg-[oklch(0.95_0.06_25)] text-[oklch(0.48_0.18_25)] dark:bg-[oklch(0.32_0.10_25)] dark:text-[oklch(0.88_0.12_25)]";
  }
}

export function statusLabel(s: ProjectStatus, locale: "en" | "zh"): string {
  const map: Record<ProjectStatus, { en: string; zh: string }> = {
    Estimate: { en: "Under Review", zh: "审核中" },
    Active: { en: "In Construction", zh: "施工中" },
    "Pending Payment": { en: "Pending Settlement", zh: "待结算" },
    Completed: { en: "Completed", zh: "已完成" },
    Cancelled: { en: "Cancelled", zh: "已取消" },
  };
  return map[s][locale];
}

export function paymentLabel(p: PaymentMethod, locale: "en" | "zh"): string {
  const map: Record<PaymentMethod, { en: string; zh: string }> = {
    Cash: { en: "Cash", zh: "现金" },
    Check: { en: "Check", zh: "支票" },
    "Bank Transfer": { en: "Bank Transfer", zh: "转账" },
    Zelle: { en: "Zelle", zh: "Zelle" },
    "Credit Card": { en: "Credit Card", zh: "信用卡" },
    Other: { en: "Other", zh: "其他" },
  };
  return map[p][locale];
}
