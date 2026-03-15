-- M8.S3.a: Add part_financial_profiles table for business impact analysis
CREATE TABLE IF NOT EXISTS public.part_financial_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  part_id uuid NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  annual_spend numeric(14,2) DEFAULT 0,
  unit_cost numeric(10,2),
  annual_volume integer,
  lead_time_days integer,
  currency text DEFAULT 'USD',
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT part_financial_profiles_org_part_key UNIQUE (organization_id, part_id)
);

-- Enable RLS
ALTER TABLE public.part_financial_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies: org-scoped read/write
CREATE POLICY "org_scoped_part_financial_profiles_select"
  ON public.part_financial_profiles
  FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "org_scoped_part_financial_profiles_insert"
  ON public.part_financial_profiles
  FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "org_scoped_part_financial_profiles_update"
  ON public.part_financial_profiles
  FOR UPDATE
  USING (public.is_org_member(organization_id));

CREATE POLICY "org_scoped_part_financial_profiles_delete"
  ON public.part_financial_profiles
  FOR DELETE
  USING (public.is_org_member(organization_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_part_financial_profiles_org
  ON public.part_financial_profiles(organization_id);

CREATE INDEX IF NOT EXISTS idx_part_financial_profiles_part
  ON public.part_financial_profiles(part_id);
