CREATE TABLE public.company_profile (
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
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_profile_singleton CHECK (id = true)
);

GRANT SELECT ON public.company_profile TO anon;
GRANT SELECT, INSERT, UPDATE ON public.company_profile TO authenticated;
GRANT ALL ON public.company_profile TO service_role;

ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company profile public read"
  ON public.company_profile FOR SELECT
  USING (true);

CREATE POLICY "Authenticated insert company profile"
  ON public.company_profile FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated update company profile"
  ON public.company_profile FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER company_profile_set_updated_at
  BEFORE UPDATE ON public.company_profile
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.company_profile (id) VALUES (true) ON CONFLICT DO NOTHING;