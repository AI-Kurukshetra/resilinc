-- M10.S1.a / M10.S2.a / M10.S3.a: Extended Risk Dimensions
-- Tables: supplier_esg_scores, supplier_financial_health, geopolitical_risk_profiles

-- ─── SUPPLIER ESG SCORES ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.supplier_esg_scores (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_id         uuid          NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  environmental_score numeric(5,2)  NOT NULL DEFAULT 0 CHECK (environmental_score >= 0 AND environmental_score <= 100),
  social_score        numeric(5,2)  NOT NULL DEFAULT 0 CHECK (social_score >= 0 AND social_score <= 100),
  governance_score    numeric(5,2)  NOT NULL DEFAULT 0 CHECK (governance_score >= 0 AND governance_score <= 100),
  composite_score     numeric(5,2)  NOT NULL DEFAULT 0 CHECK (composite_score >= 0 AND composite_score <= 100),
  assessment_date     timestamptz   NOT NULL DEFAULT now(),
  notes               text,
  created_at          timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT supplier_esg_scores_org_supplier_key UNIQUE (organization_id, supplier_id)
);

ALTER TABLE public.supplier_esg_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_scoped_supplier_esg_scores"
  ON public.supplier_esg_scores
  FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX IF NOT EXISTS idx_supplier_esg_scores_org
  ON public.supplier_esg_scores(organization_id);

CREATE INDEX IF NOT EXISTS idx_supplier_esg_scores_supplier
  ON public.supplier_esg_scores(supplier_id);

-- ─── SUPPLIER FINANCIAL HEALTH ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.supplier_financial_health (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_id             uuid          NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  credit_rating           text          CHECK (credit_rating IN ('AAA','AA','A','BBB','BB','B','CCC','CC','C','D','NR')),
  altman_z_score          numeric(6,3),
  revenue_trend           text          CHECK (revenue_trend IN ('growing','stable','declining','unknown')),
  debt_to_equity          numeric(6,3),
  days_payable_outstanding integer,
  financial_risk_level    text          NOT NULL DEFAULT 'medium' CHECK (financial_risk_level IN ('low','medium','high','critical')),
  assessed_at             timestamptz   NOT NULL DEFAULT now(),
  notes                   text,
  created_at              timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT supplier_financial_health_org_supplier_key UNIQUE (organization_id, supplier_id)
);

ALTER TABLE public.supplier_financial_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_scoped_supplier_financial_health"
  ON public.supplier_financial_health
  FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX IF NOT EXISTS idx_supplier_financial_health_org
  ON public.supplier_financial_health(organization_id);

CREATE INDEX IF NOT EXISTS idx_supplier_financial_health_supplier
  ON public.supplier_financial_health(supplier_id);

-- ─── GEOPOLITICAL RISK PROFILES ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.geopolitical_risk_profiles (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  region_code             text          NOT NULL,
  risk_level              text          NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low','medium','high','critical')),
  stability_index         numeric(5,2)  CHECK (stability_index >= 0 AND stability_index <= 100),
  sanctions_active        boolean       NOT NULL DEFAULT false,
  trade_restriction_notes text,
  updated_at              timestamptz   NOT NULL DEFAULT now(),
  created_at              timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT geopolitical_risk_profiles_org_region_key UNIQUE (organization_id, region_code)
);

ALTER TABLE public.geopolitical_risk_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_scoped_geopolitical_risk_profiles"
  ON public.geopolitical_risk_profiles
  FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX IF NOT EXISTS idx_geopolitical_risk_profiles_org
  ON public.geopolitical_risk_profiles(organization_id);

CREATE INDEX IF NOT EXISTS idx_geopolitical_risk_profiles_region
  ON public.geopolitical_risk_profiles(organization_id, region_code);
