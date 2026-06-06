-- ============================================================
-- Construction Hub — Full schema (re-runnable on fresh Supabase)
-- Run BEFORE construction_seed_data.sql.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM types
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin','admin','estimator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Shared trigger function: update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============================================================
-- Authentication / role tables
-- ============================================================

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles read own" ON public.profiles;
CREATE POLICY "Profiles read own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Profiles insert own" ON public.profiles;
CREATE POLICY "Profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Profiles update own" ON public.profiles;
CREATE POLICY "Profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "User roles read own" ON public.user_roles;
CREATE POLICY "User roles read own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "User roles super admin manage" ON public.user_roles;
CREATE POLICY "User roles super admin manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE user_count int;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  SELECT count(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'estimator');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Company profile (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.company_profile (
  id boolean PRIMARY KEY DEFAULT true,
  name text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  license text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  tax_rate text NOT NULL DEFAULT '0',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_profile TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.company_profile TO authenticated;
GRANT ALL ON public.company_profile TO service_role;
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Company profile public read" ON public.company_profile;
CREATE POLICY "Company profile public read" ON public.company_profile FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins insert company profile" ON public.company_profile;
CREATE POLICY "Admins insert company profile" ON public.company_profile FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS "Admins update company profile" ON public.company_profile;
CREATE POLICY "Admins update company profile" ON public.company_profile FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS "Admins delete company profile" ON public.company_profile;
CREATE POLICY "Admins delete company profile" ON public.company_profile FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============================================================
-- Construction Library (V2)
-- ============================================================

-- categories
CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  name_en text NOT NULL,
  name_zh text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories public read" ON public.categories;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories admin insert" ON public.categories;
CREATE POLICY "categories admin insert" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS "categories admin update" ON public.categories;
CREATE POLICY "categories admin update" ON public.categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS "categories admin delete" ON public.categories;
CREATE POLICY "categories admin delete" ON public.categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- units
CREATE TABLE IF NOT EXISTS public.units (
  code text PRIMARY KEY,
  label_en text NOT NULL,
  label_zh text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.units TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "units public read" ON public.units;
CREATE POLICY "units public read" ON public.units FOR SELECT USING (true);
DROP POLICY IF EXISTS "units admin write" ON public.units;
CREATE POLICY "units admin write" ON public.units FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- pricing_types
CREATE TABLE IF NOT EXISTS public.pricing_types (
  code text PRIMARY KEY,
  label_en text NOT NULL,
  label_zh text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_types TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pricing_types TO authenticated;
GRANT ALL ON public.pricing_types TO service_role;
ALTER TABLE public.pricing_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pricing_types public read" ON public.pricing_types;
CREATE POLICY "pricing_types public read" ON public.pricing_types FOR SELECT USING (true);
DROP POLICY IF EXISTS "pricing_types admin write" ON public.pricing_types;
CREATE POLICY "pricing_types admin write" ON public.pricing_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- construction_items
CREATE TABLE IF NOT EXISTS public.construction_items (
  id text PRIMARY KEY,
  category_id text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_zh text NOT NULL DEFAULT '',
  unit text NOT NULL,
  default_pricing text NOT NULL DEFAULT 'Estimate',
  labor_rate numeric NOT NULL DEFAULT 0,
  material_rate numeric NOT NULL DEFAULT 0,
  hours_per_unit numeric NOT NULL DEFAULT 0,
  notes text,
  is_custom boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_construction_items_category ON public.construction_items(category_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_construction_items_dedup
  ON public.construction_items(category_id, lower(name_en), lower(name_zh), lower(unit));
GRANT SELECT ON public.construction_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.construction_items TO authenticated;
GRANT ALL ON public.construction_items TO service_role;
ALTER TABLE public.construction_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "construction_items public read" ON public.construction_items;
CREATE POLICY "construction_items public read" ON public.construction_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "construction_items admin insert" ON public.construction_items;
CREATE POLICY "construction_items admin insert" ON public.construction_items FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS "construction_items admin update" ON public.construction_items;
CREATE POLICY "construction_items admin update" ON public.construction_items FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS "construction_items admin delete" ON public.construction_items;
CREATE POLICY "construction_items admin delete" ON public.construction_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP TRIGGER IF EXISTS trg_construction_items_updated_at ON public.construction_items;
CREATE TRIGGER trg_construction_items_updated_at BEFORE UPDATE ON public.construction_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- terms_conditions
CREATE TABLE IF NOT EXISTS public.terms_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  locale text NOT NULL DEFAULT 'en',
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.terms_conditions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.terms_conditions TO authenticated;
GRANT ALL ON public.terms_conditions TO service_role;
ALTER TABLE public.terms_conditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "terms public read" ON public.terms_conditions;
CREATE POLICY "terms public read" ON public.terms_conditions FOR SELECT USING (true);
DROP POLICY IF EXISTS "terms admin write" ON public.terms_conditions;
CREATE POLICY "terms admin write" ON public.terms_conditions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP TRIGGER IF EXISTS trg_terms_updated_at ON public.terms_conditions;
CREATE TRIGGER trg_terms_updated_at BEFORE UPDATE ON public.terms_conditions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- pdf_templates
CREATE TABLE IF NOT EXISTS public.pdf_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pdf_templates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pdf_templates TO authenticated;
GRANT ALL ON public.pdf_templates TO service_role;
ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pdf_templates public read" ON public.pdf_templates;
CREATE POLICY "pdf_templates public read" ON public.pdf_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "pdf_templates admin write" ON public.pdf_templates;
CREATE POLICY "pdf_templates admin write" ON public.pdf_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP TRIGGER IF EXISTS trg_pdf_templates_updated_at ON public.pdf_templates;
CREATE TRIGGER trg_pdf_templates_updated_at BEFORE UPDATE ON public.pdf_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_settings public read" ON public.system_settings;
CREATE POLICY "system_settings public read" ON public.system_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "system_settings admin write" ON public.system_settings;
CREATE POLICY "system_settings admin write" ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid()::uuid,'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
DROP TRIGGER IF EXISTS trg_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trg_system_settings_updated_at BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
