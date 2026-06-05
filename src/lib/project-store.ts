import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProjectStatus = "Estimate" | "Active" | "Pending Payment" | "Completed";

// Sub-statuses per stage
export type EstimateSubStatus = "Draft" | "Sent" | "Waiting Approval";
export type ActiveSubStatus = "Planning" | "In Progress" | "Inspection";
export type PendingSubStatus = "Pending Payment" | "Final Payment Due" | "Completed";

export interface Project {
  id: string;
  customerName: string;
  projectAddress: string;
  estimateNumber: string;
  amount: number; // estimate / contract amount
  paidAmount: number;
  estimateDate: string;
  startDate?: string;
  expectedEndDate?: string;
  status: ProjectStatus;
  subStatus: string;
  notes?: string;
}

interface ProjectsState {
  projects: Project[];
  add: (p: Omit<Project, "id">) => void;
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
  // Estimate stage
  {
    id: "p-e1",
    customerName: "James Liu",
    projectAddress: "1421 Cedar St, Palo Alto, CA",
    estimateNumber: "EST-2026-1042",
    amount: 28500,
    paidAmount: 0,
    estimateDate: addDays(-2),
    status: "Estimate",
    subStatus: "Sent",
  },
  {
    id: "p-e2",
    customerName: "Maria Gonzalez",
    projectAddress: "88 Oak Ave, San Jose, CA",
    estimateNumber: "EST-2026-1043",
    amount: 64200,
    paidAmount: 0,
    estimateDate: addDays(-5),
    status: "Estimate",
    subStatus: "Waiting Approval",
  },
  {
    id: "p-e3",
    customerName: "Wei Chen",
    projectAddress: "2200 Mission Blvd, Fremont, CA",
    estimateNumber: "EST-2026-1044",
    amount: 92500,
    paidAmount: 0,
    estimateDate: addDays(-1),
    status: "Estimate",
    subStatus: "Draft",
  },
  // Active stage
  {
    id: "p-a1",
    customerName: "Daniel Park",
    projectAddress: "501 Forest Rd, Menlo Park, CA",
    estimateNumber: "EST-2026-0998",
    amount: 145000,
    paidAmount: 50000,
    estimateDate: addDays(-30),
    startDate: addDays(-14),
    expectedEndDate: addDays(28),
    status: "Active",
    subStatus: "In Progress",
  },
  {
    id: "p-a2",
    customerName: "Sophia Nguyen",
    projectAddress: "77 Elm St, Sunnyvale, CA",
    estimateNumber: "EST-2026-1001",
    amount: 88000,
    paidAmount: 30000,
    estimateDate: addDays(-25),
    startDate: addDays(-7),
    expectedEndDate: addDays(35),
    status: "Active",
    subStatus: "Planning",
  },
  // Pending Payment stage
  {
    id: "p-p1",
    customerName: "Robert Kim",
    projectAddress: "910 Birch Ln, Cupertino, CA",
    estimateNumber: "EST-2025-0871",
    amount: 72000,
    paidAmount: 50000,
    estimateDate: addDays(-90),
    startDate: addDays(-75),
    expectedEndDate: addDays(-5),
    status: "Pending Payment",
    subStatus: "Pending Payment",
  },
  {
    id: "p-p2",
    customerName: "Linda Zhao",
    projectAddress: "33 Walnut Way, Mountain View, CA",
    estimateNumber: "EST-2025-0850",
    amount: 38000,
    paidAmount: 15000,
    estimateDate: addDays(-110),
    startDate: addDays(-90),
    expectedEndDate: addDays(-15),
    status: "Pending Payment",
    subStatus: "Final Payment Due",
  },
];

export const useProjects = create<ProjectsState>()(
  persist(
    (set) => ({
      projects: SEED,
      add: (p) => set((s) => ({ projects: [...s.projects, { ...p, id: crypto.randomUUID() }] })),
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
    { name: "construction-hub-projects" },
  ),
);

export function summarizeProjects(projects: Project[]) {
  const estimates = projects.filter((p) => p.status === "Estimate");
  const active = projects.filter((p) => p.status === "Active");
  const pending = projects.filter((p) => p.status === "Pending Payment");
  const completed = projects.filter((p) => p.status === "Completed");
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
