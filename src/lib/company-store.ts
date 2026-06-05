import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompanyProfile {
  name: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  license: string;
  website: string;
  taxRate: string;
}

interface CompanyState {
  profile: CompanyProfile;
  setProfile: (patch: Partial<CompanyProfile>) => void;
}

const initial: CompanyProfile = {
  name: "",
  logoUrl: "",
  phone: "",
  email: "",
  address: "",
  license: "",
  website: "",
  taxRate: "0",
};

export const useCompany = create<CompanyState>()(
  persist(
    (set) => ({
      profile: initial,
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
    }),
    { name: "construction-hub-company" },
  ),
);
