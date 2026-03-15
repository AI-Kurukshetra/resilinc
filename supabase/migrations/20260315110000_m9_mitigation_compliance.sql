-- M9.S1.a / M9.S2.a: Mitigation plans, actions, compliance frameworks, compliance items

-- ─── MITIGATION PLANS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mitigation_plans (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid         NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_id     uuid         REFERENCES public.suppliers(id) ON DELETE SET NULL,
  alert_id        uuid         REFERENCES public.alerts(id) ON DELETE SET NULL,
  title           text         NOT NULL,
  description     text         NOT NULL DEFAULT '',
  strategy        text         NOT NULL CHECK (strategy IN ('avoid','mitigate','transfer','accept')),
  status          text         NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','archived')),
  priority        smallint     NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  owner_id        uuid         REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  target_date     timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.mitigation_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_scoped_mitigation_plans"
  ON public.mitigation_plans
  FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX IF NOT EXISTS idx_mitigation_plans_org_status
  ON public.mitigation_plans(organization_id, status);

-- ─── MITIGATION ACTIONS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mitigation_actions (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid         NOT NULL REFERENCES public.mitigation_plans(id) ON DELETE CASCADE,
  organization_id uuid         NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title           text         NOT NULL,
  status          text         NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  owner_id        uuid         REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  due_date        timestamptz,
  notes           text,
  created_at      timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.mitigation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_scoped_mitigation_actions"
  ON public.mitigation_actions
  FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX IF NOT EXISTS idx_mitigation_actions_org_status
  ON public.mitigation_actions(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_mitigation_actions_plan
  ON public.mitigation_actions(plan_id);

-- ─── COMPLIANCE FRAMEWORKS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.compliance_frameworks (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid         NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            text         NOT NULL,
  description     text         NOT NULL DEFAULT '',
  category        text         NOT NULL CHECK (category IN ('regulatory','industry','internal','esg')),
  created_at      timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT compliance_frameworks_org_name_key UNIQUE (organization_id, name)
);

ALTER TABLE public.compliance_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_scoped_compliance_frameworks"
  ON public.compliance_frameworks
  FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX IF NOT EXISTS idx_compliance_frameworks_org
  ON public.compliance_frameworks(organization_id);

-- ─── COMPLIANCE ITEMS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.compliance_items (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id     uuid         NOT NULL REFERENCES public.compliance_frameworks(id) ON DELETE CASCADE,
  organization_id  uuid         NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_id      uuid         REFERENCES public.suppliers(id) ON DELETE SET NULL,
  requirement      text         NOT NULL,
  status           text         NOT NULL DEFAULT 'not_assessed'
                                CHECK (status IN ('not_assessed','compliant','non_compliant','partially_compliant','exempted')),
  evidence_notes   text,
  assessed_at      timestamptz,
  next_review_date timestamptz,
  created_at       timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_scoped_compliance_items"
  ON public.compliance_items
  FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX IF NOT EXISTS idx_compliance_items_org_status
  ON public.compliance_items(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_compliance_items_framework
  ON public.compliance_items(framework_id);
