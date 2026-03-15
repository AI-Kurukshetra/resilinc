-- M12.S1.a / M12.S2.a: Communication Hub + Transportation Risk Monitoring
-- Tables: notifications, transportation_routes

-- ─── NOTIFICATIONS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id           uuid          REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title             text          NOT NULL,
  message           text          NOT NULL,
  type              text          NOT NULL CHECK (type IN ('alert','incident','mitigation','compliance','system')),
  reference_type    text,
  reference_id      uuid,
  is_read           boolean       NOT NULL DEFAULT false,
  created_at        timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_scoped_notifications"
  ON public.notifications
  FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX IF NOT EXISTS idx_notifications_org_user_created
  ON public.notifications(organization_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_org_is_read
  ON public.notifications(organization_id, is_read);

-- ─── TRANSPORTATION ROUTES ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.transportation_routes (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name                    text          NOT NULL,
  origin_facility_id      uuid          REFERENCES public.facilities(id) ON DELETE SET NULL,
  destination_name        text          NOT NULL,
  transport_mode          text          NOT NULL CHECK (transport_mode IN ('ocean','air','rail','road','multimodal')),
  estimated_transit_days  integer       NOT NULL DEFAULT 0,
  risk_level              text          NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  active_disruptions      text,
  updated_at              timestamptz   NOT NULL DEFAULT now(),
  created_at              timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.transportation_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_scoped_transportation_routes"
  ON public.transportation_routes
  FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE INDEX IF NOT EXISTS idx_transportation_routes_org
  ON public.transportation_routes(organization_id);

CREATE INDEX IF NOT EXISTS idx_transportation_routes_org_mode
  ON public.transportation_routes(organization_id, transport_mode);

CREATE INDEX IF NOT EXISTS idx_transportation_routes_org_risk
  ON public.transportation_routes(organization_id, risk_level);
