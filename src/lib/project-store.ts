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
}

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return iso(d);
};

const SEED: Project[] = [
  {
    id: "p-e1",
    customerName: "James Liu",
    customerPhone: "(510) 123-4567",
    projectAddress: "1421 Cedar St, Palo Alto, CA",
    estimateNumber: "EST-2026-1042",
    amount: 28500,
    discount: 0,
    paidAmount: 0,
    estimateDate: addDays(-2),
    issueDate: addDays(-2),
    status: "Estimate",
    subStatus: "Sent",
    notes: "Kitchen flooring + paint.",
  },
  {
    id: "p-e2",
    customerName: "Maria Gonzalez",
    customerPhone: "(408) 555-0192",
    projectAddress: "88 Oak Ave, San Jose, CA",
    estimateNumber: "EST-2026-1043",
    amount: 64200,
    discount: 1200,
    paidAmount: 0,
    estimateDate: addDays(-5),
    issueDate: addDays(-4),
    status: "Estimate",
    subStatus: "Waiting Approval",
  },
  {
    id: "p-e3",
    customerName: "Wei Chen",
    customerPhone: "(415) 888-2210",
    projectAddress: "2200 Mission Blvd, Fremont, CA",
    estimateNumber: "EST-2026-1044",
    amount: 92500,
    paidAmount: 0,
    estimateDate: addDays(-1),
    status: "Estimate",
    subStatus: "Draft",
  },
  {
    id: "p-a1",
    customerName: "Daniel Park",
    customerPhone: "(650) 222-1188",
    projectAddress: "501 Forest Rd, Menlo Park, CA",
    estimateNumber: "EST-2026-0998",
    amount: 145000,
    paidAmount: 50000,
    estimateDate: addDays(-30),
    issueDate: addDays(-29),
    startDate: addDays(-14),
    expectedEndDate: addDays(28),
    status: "Active",
    subStatus: "In Progress",
    paymentMethod: "Bank Transfer",
  },
  {
    id: "p-a2",
    customerName: "Sophia Nguyen",
    customerPhone: "(408) 401-9922",
    projectAddress: "77 Elm St, Sunnyvale, CA",
    estimateNumber: "EST-2026-1001",
    amount: 88000,
    paidAmount: 30000,
    estimateDate: addDays(-25),
    issueDate: addDays(-24),
    startDate: addDays(-7),
    expectedEndDate: addDays(35),
    status: "Active",
    subStatus: "Planning",
  },
  {
    id: "p-p1",
    customerName: "Robert Kim",
    customerPhone: "(408) 777-3344",
    projectAddress: "910 Birch Ln, Cupertino, CA",
    estimateNumber: "EST-2025-0871",
    amount: 72000,
    paidAmount: 50000,
    estimateDate: addDays(-90),
    issueDate: addDays(-90),
    startDate: addDays(-75),
    expectedEndDate: addDays(-5),
    settlementDate: addDays(-2),
    status: "Pending Payment",
    subStatus: "Pending Payment",
    paymentMethod: "Check",
  },
  {
    id: "p-p2",
    customerName: "Linda Zhao",
    customerPhone: "(650) 909-5566",
    projectAddress: "33 Walnut Way, Mountain View, CA",
    estimateNumber: "EST-2025-0850",
    amount: 38000,
    paidAmount: 15000,
    estimateDate: addDays(-110),
    issueDate: addDays(-110),
    startDate: addDays(-90),
    expectedEndDate: addDays(-15),
    settlementDate: addDays(-10),
    status: "Pending Payment",
    subStatus: "Final Payment Due",
    paymentMethod: "Zelle",
  },
];

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
    }),
    { name: "construction-hub-projects-v2" },
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
