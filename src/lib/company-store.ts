import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";

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
  loaded: boolean;
  setProfile: (patch: Partial<CompanyProfile>) => void;
  hydrateFromRemote: () => Promise<void>;
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

type Row = {
  name: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  license: string | null;
  website: string | null;
  tax_rate: string | null;
};

function rowToProfile(r: Row): CompanyProfile {
  return {
    name: r.name ?? "",
    logoUrl: r.logo_url ?? "",
    phone: r.phone ?? "",
    email: r.email ?? "",
    address: r.address ?? "",
    license: r.license ?? "",
    website: r.website ?? "",
    taxRate: r.tax_rate ?? "0",
  };
}

type UpdateRow = {
  name?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  license?: string;
  website?: string;
  tax_rate?: string;
};

function profileToRow(p: Partial<CompanyProfile>): UpdateRow {
  const out: UpdateRow = {};
  if (p.name !== undefined) out.name = p.name;
  if (p.logoUrl !== undefined) out.logo_url = p.logoUrl;
  if (p.phone !== undefined) out.phone = p.phone;
  if (p.email !== undefined) out.email = p.email;
  if (p.address !== undefined) out.address = p.address;
  if (p.license !== undefined) out.license = p.license;
  if (p.website !== undefined) out.website = p.website;
  if (p.taxRate !== undefined) out.tax_rate = p.taxRate;
  return out;
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pending: Partial<CompanyProfile> = {};

function schedulePush(patch: Partial<CompanyProfile>) {
  if (typeof window === "undefined") return;
  pending = { ...pending, ...patch };
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const payload = profileToRow(pending);
    pending = {};
    pushTimer = null;
    if (Object.keys(payload).length === 0) return;
    const { error } = await supabase
      .from("company_profile")
      .update(payload)
      .eq("id", true);
    if (error) console.error("[company_profile] save failed", error);
  }, 400);
}

export const useCompany = create<CompanyState>()(
  persist(
    (set, get) => ({
      profile: initial,
      loaded: false,
      setProfile: (patch) => {
        set((s) => ({ profile: { ...s.profile, ...patch } }));
        schedulePush(patch);
      },
      hydrateFromRemote: async () => {
        if (typeof window === "undefined") return;
        const { data, error } = await supabase
          .from("company_profile")
          .select("name,logo_url,phone,email,address,license,website,tax_rate")
          .eq("id", true)
          .maybeSingle();
        if (error) {
          console.error("[company_profile] load failed", error);
          set({ loaded: true });
          return;
        }
        if (data) {
          set({ profile: rowToProfile(data as Row), loaded: true });
        } else {
          set({ loaded: true });
        }
      },
    }),
    { name: "construction-hub-company" },
  ),
);

/** Mount once near the app root to keep the store in sync with the database. */
export function useCompanyHydration() {
  useEffect(() => {
    void useCompany.getState().hydrateFromRemote();
    const channel = supabase.channel(
      `company_profile_changes_${Math.random().toString(36).slice(2)}`,
    );
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "company_profile" },
      (payload) => {
        const row = (payload.new ?? payload.old) as Row | null;
        if (row) {
          useCompany.setState({ profile: rowToProfile(row), loaded: true });
        }
      },
    );
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
}
