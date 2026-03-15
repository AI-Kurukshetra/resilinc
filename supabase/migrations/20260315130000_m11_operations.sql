-- M11.S1.a / M11.S2.a / M11.S3.a: Operational Features
-- Tables: supplier_performance_records, part_inventory_levels, integrations

-- ─── SUPPLIER PERFORMANCE RECORDS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.supplier_performance_records (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_id             uuid          NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  period_start            date          NOT NULL,
  period_end              date          NOT NULL,
  on_time_delivery_rate   numeric(5,2)  NOT NULL CHECK (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 100),
  quality_rejection_rate  numeric(5,2)  NOT NULL CHECK (quality_rejection_rate >= 0 AND quality_rejection_rate <= 100),
  lead_time_variance_days integer       NOT NULL DEFAULT 0,
  responsiveness_score    smallint      NOT NULL CHECK (responsiveness_score >= 1 AND responsiveness_score <= 5),
  overall_rating          numeric(5,2)  NOT NULL DEFAULT 0 CHECK (overall_rating >= 0 AND overall_rating <= 100),
  notes                   text,
  created_at              timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_performance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_scoped_supplier_performance_records"
  ON public.supplier_performance_records
  FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX IF NOT EXISTS idx_supplier_performance_records_org
  ON public.supplier_performance_records(organization_id);

CREATE INDEX IF NOT EXISTS idx_supplier_performance_records_supplier
  ON public.supplier_performance_records(organization_id, supplier_id);

-- ─── PART INVENTORY LEVELS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.part_inventory_levels (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  part_id                 uuid          NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  current_stock           integer       NOT NULL DEFAULT 0,
  safety_stock            integer       NOT NULL DEFAULT 0,
  reorder_point           integer       NOT NULL DEFAULT 0,
  max_stock               integer,
  avg_daily_consumption   numeric(10,2) NOT NULL DEFAULT 0,
  days_of_supply          numeric(8,2),
  risk_flag               text          NOT NULL DEFAULT 'adequate' CHECK (risk_flag IN ('adequate','low','critical','stockout')),
  updated_at              timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT part_inventory_levels_org_part_key UNIQUE (organization_id, part_id)
);

ALTER TABLE public.part_inventory_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_scoped_part_inventory_levels"
  ON public.part_inventory_levels
  FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX IF NOT EXISTS idx_part_inventory_levels_org
  ON public.part_inventory_levels(organization_id);

CREATE INDEX IF NOT EXISTS idx_part_inventory_levels_part
  ON public.part_inventory_levels(organization_id, part_id);

-- ─── INTEGRATIONS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.integrations (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name              text          NOT NULL,
  type              text          NOT NULL CHECK (type IN ('api_connector','webhook','data_feed','manual')),
  status            text          NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive','error')),
  config            jsonb         NOT NULL DEFAULT '{}',
  last_sync_at      timestamptz,
  error_message     text,
  created_at        timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT integrations_org_name_key UNIQUE (organization_id, name)
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_scoped_integrations"
  ON public.integrations
  FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX IF NOT EXISTS idx_integrations_org
  ON public.integrations(organization_id);

CREATE INDEX IF NOT EXISTS idx_integrations_org_status
  ON public.integrations(organization_id, status);
