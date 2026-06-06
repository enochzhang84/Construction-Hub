
-- =====================================================
-- V2 Construction Library — schema
-- =====================================================

-- 1. categories
CREATE TABLE public.categories (
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
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin insert" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "categories admin update" ON public.categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "categories admin delete" ON public.categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2. units
CREATE TABLE public.units (
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
CREATE POLICY "units public read" ON public.units FOR SELECT USING (true);
CREATE POLICY "units admin write" ON public.units FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));

-- 3. pricing_types
CREATE TABLE public.pricing_types (
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
CREATE POLICY "pricing_types public read" ON public.pricing_types FOR SELECT USING (true);
CREATE POLICY "pricing_types admin write" ON public.pricing_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));

-- 4. construction_items
CREATE TABLE public.construction_items (
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
CREATE INDEX idx_construction_items_category ON public.construction_items(category_id);
CREATE UNIQUE INDEX uniq_construction_items_dedup
  ON public.construction_items(category_id, lower(name_en), lower(name_zh), lower(unit));
GRANT SELECT ON public.construction_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.construction_items TO authenticated;
GRANT ALL ON public.construction_items TO service_role;
ALTER TABLE public.construction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "construction_items public read" ON public.construction_items FOR SELECT USING (true);
CREATE POLICY "construction_items admin insert" ON public.construction_items FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "construction_items admin update" ON public.construction_items FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "construction_items admin delete" ON public.construction_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_construction_items_updated_at BEFORE UPDATE ON public.construction_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5. terms_conditions
CREATE TABLE public.terms_conditions (
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
CREATE POLICY "terms public read" ON public.terms_conditions FOR SELECT USING (true);
CREATE POLICY "terms admin write" ON public.terms_conditions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_terms_updated_at BEFORE UPDATE ON public.terms_conditions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 6. pdf_templates
CREATE TABLE public.pdf_templates (
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
CREATE POLICY "pdf_templates public read" ON public.pdf_templates FOR SELECT USING (true);
CREATE POLICY "pdf_templates admin write" ON public.pdf_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_pdf_templates_updated_at BEFORE UPDATE ON public.pdf_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 7. system_settings
CREATE TABLE public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_settings public read" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "system_settings admin write" ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER trg_system_settings_updated_at BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
