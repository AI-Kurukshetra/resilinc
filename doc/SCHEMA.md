# SCHEMA

## Migrations
- `supabase/migrations/20260314110000_init_resilinc_mvp.sql`
- `supabase/migrations/20260314170000_m2_hardening.sql`
- `supabase/migrations/20260314183000_m4_risk_alert_incident_workflows.sql`
- `supabase/migrations/20260315100000_m8_analytics_impact.sql`
- `supabase/migrations/20260315110000_m9_mitigation_compliance.sql`
- `supabase/migrations/20260315120000_m10_extended_risk.sql`
- `supabase/migrations/20260315130000_m11_operations.sql`
- `supabase/migrations/20260315140000_m12_comms_transport.sql`

## Core Tables
- `organizations`
- `profiles`
- `organization_members`
- `suppliers`
- `facilities`
- `parts`
- `supplier_parts`
- `risk_events`
- `risk_event_suppliers`
- `supplier_risk_scores`
- `alerts`
- `alert_events`
- `incidents`
- `incident_actions`
- `part_financial_profiles`
- `mitigation_plans`
- `mitigation_actions`
- `compliance_frameworks`
- `compliance_items`
- `supplier_esg_scores`
- `supplier_financial_health`
- `geopolitical_risk_profiles`
- `supplier_performance_records`
- `part_inventory_levels`
- `integrations`
- `notifications`
- `transportation_routes`

## Key Relationships
- Organization -> suppliers, facilities, parts, risk events, alerts, incidents (`organization_id` FK)
- Supplier -> facilities (`facilities.supplier_id`)
- Supplier <-> parts (`supplier_parts` join with `tier_level`)
- Risk events <-> suppliers (`risk_event_suppliers`)
- Alerts optionally reference supplier + risk event, plus owner/ack/resolution actors
- Alert events append lifecycle timeline entries for generated/escalated/owner_assigned/acknowledged/resolved state changes
- Incidents reference alerts; incident actions reference incidents
- Mitigation plans optionally reference supplier + alert; mitigation actions reference plans
- Compliance frameworks belong to org; compliance items reference frameworks and optionally suppliers
- Supplier performance records reference org + supplier (multiple records per supplier, one per period)
- Part inventory levels reference org + part (unique per org+part, upsert model)
- Integrations belong to org (unique name per org)
- Notifications belong to org, optionally to a user (user_id FK nullable to profiles)
- Transportation routes belong to org, optionally link to origin facility (FK nullable to facilities on delete set null)

## RLS Model
- All business tables have RLS enabled.
- Org-scoped tables enforce membership with `public.is_org_member(organization_id)`.
- Owner checks now use `public.is_org_owner(organization_id)` for membership mutations.
- Profiles are self-scoped (`user_id = (select auth.uid())`).
- `alert_events` is org-scoped with dedicated `org_scoped_alert_events` policy.

### `organization_members` policy hardening (M2.S1)
- Replaced permissive self-insert/update behavior with:
  - `organization_members_self_bootstrap_insert`: self-membership insert only for orgs created by current user.
  - `organization_members_owner_insert`: owner-managed member inserts.
  - `organization_members_owner_update`: owner-managed member updates.
  - `organization_members_owner_delete`: owner-managed member deletes.

## Index / Constraint Coverage
Added in `20260314170000_m2_hardening.sql`:
- `idx_organization_members_user_created`
- `idx_facilities_org_supplier`
- `idx_supplier_parts_org_supplier`
- `idx_supplier_parts_org_part`
- `idx_risk_event_suppliers_org_supplier`
- `suppliers_org_name_key` unique (`organization_id`, `name`)
- `facilities_org_supplier_name_key` unique (`organization_id`, `supplier_id`, `name`)

Added in `20260314183000_m4_risk_alert_incident_workflows.sql`:
- `idx_alert_events_org_created_at_desc`
- `idx_alert_events_alert_created_at_asc`
- `idx_alert_events_org_event_type`
- `idx_incidents_active_alert_unique` partial unique (`alert_id`) where status in (`open`, `in_progress`)

## M4 Alert/Incident Columns
`alerts` additions:
- `owner_id` -> `profiles(user_id)`
- `owner_assigned_at`
- `resolved_by` -> `profiles(user_id)`
- `resolved_at`
- `resolution_note`

## Seed Strategy (M2.S1.b)
File: `supabase/seed.sql`

Behavior:
- Idempotent script based on first `auth.users` record.
- Creates/updates:
  - profile for seed user
  - one demo organization (`Apex Devices Group`)
  - owner membership for seed user
  - realistic supplier network (5 suppliers)
  - facilities across regions (7 facilities)
  - parts catalog (8 parts)
  - supplier-part tier links (11 links)

Assumptions:
- At least one authenticated user exists before seeding.
- Seed prioritizes realistic hierarchy for demo workflows (tier 1/2/3 exposure).
- Script can be re-run safely (`on conflict` updates).

## M8 Part Financial Profiles (M8.S3)
`part_financial_profiles`:
- `id` uuid PK
- `organization_id` FK -> organizations
- `part_id` FK -> parts
- `annual_spend` numeric(14,2) default 0
- `unit_cost` numeric(10,2)
- `annual_volume` integer
- `lead_time_days` integer
- `currency` text default 'USD'
- `updated_at` timestamptz
- UNIQUE constraint on `(organization_id, part_id)`
- RLS: org-scoped select/insert/update/delete via `is_org_member()`
- Indexes: `idx_part_financial_profiles_org`, `idx_part_financial_profiles_part`

## Storage
- Private bucket: `incident-evidence`.

## M9 Mitigation Plans + Actions (M9.S1)
`mitigation_plans`:
- `id` uuid PK
- `organization_id` FK -> organizations
- `supplier_id` FK -> suppliers (nullable)
- `alert_id` FK -> alerts (nullable)
- `title`, `description` text
- `strategy` text CHECK in 'avoid'/'mitigate'/'transfer'/'accept'
- `status` text CHECK in 'draft'/'active'/'completed'/'archived' default 'draft'
- `priority` smallint 1–5 default 3
- `owner_id` FK -> profiles (nullable)
- `target_date`, `completed_at` timestamptz nullable
- `created_at`, `updated_at` timestamptz
- RLS: `org_scoped_mitigation_plans` ALL policy via `is_org_member()`
- Index: `idx_mitigation_plans_org_status`

`mitigation_actions`:
- `id` uuid PK
- `plan_id` FK -> mitigation_plans
- `organization_id` FK -> organizations
- `title` text, `status` CHECK in 'pending'/'in_progress'/'completed'/'cancelled' default 'pending'
- `owner_id` FK -> profiles (nullable), `due_date` timestamptz nullable, `notes` text
- `created_at` timestamptz
- RLS: `org_scoped_mitigation_actions` ALL policy via `is_org_member()`
- Indexes: `idx_mitigation_actions_org_status`, `idx_mitigation_actions_plan`

## M9 Compliance Frameworks + Items (M9.S2)
`compliance_frameworks`:
- `id` uuid PK
- `organization_id` FK -> organizations
- `name` text UNIQUE per org
- `description` text, `category` CHECK in 'regulatory'/'industry'/'internal'/'esg'
- `created_at` timestamptz
- RLS: `org_scoped_compliance_frameworks`
- Index: `idx_compliance_frameworks_org`

`compliance_items`:
- `id` uuid PK
- `framework_id` FK -> compliance_frameworks
- `organization_id` FK -> organizations
- `supplier_id` FK -> suppliers (nullable)
- `requirement` text
- `status` CHECK in 'not_assessed'/'compliant'/'non_compliant'/'partially_compliant'/'exempted' default 'not_assessed'
- `evidence_notes` text, `assessed_at` timestamptz nullable, `next_review_date` timestamptz nullable
- `created_at` timestamptz
- RLS: `org_scoped_compliance_items`
- Indexes: `idx_compliance_items_org_status`, `idx_compliance_items_framework`

## M10 Supplier ESG Scores (M10.S1)
`supplier_esg_scores`:
- `id` uuid PK
- `organization_id` FK -> organizations
- `supplier_id` FK -> suppliers, UNIQUE per (organization_id, supplier_id)
- `environmental_score` numeric(5,2) CHECK 0-100 default 0
- `social_score` numeric(5,2) CHECK 0-100 default 0
- `governance_score` numeric(5,2) CHECK 0-100 default 0
- `composite_score` numeric(5,2) CHECK 0-100 default 0 (auto: E*0.4 + S*0.35 + G*0.25)
- `assessment_date` timestamptz default now()
- `notes` text, `created_at` timestamptz
- RLS: `org_scoped_supplier_esg_scores`
- Indexes: `idx_supplier_esg_scores_org`, `idx_supplier_esg_scores_supplier`

## M10 Supplier Financial Health (M10.S2)
`supplier_financial_health`:
- `id` uuid PK
- `organization_id` FK -> organizations
- `supplier_id` FK -> suppliers, UNIQUE per (organization_id, supplier_id)
- `credit_rating` text CHECK in 'AAA'/'AA'/'A'/'BBB'/'BB'/'B'/'CCC'/'CC'/'C'/'D'/'NR'
- `altman_z_score` numeric(6,3)
- `revenue_trend` text CHECK in 'growing'/'stable'/'declining'/'unknown'
- `debt_to_equity` numeric(6,3)
- `days_payable_outstanding` integer
- `financial_risk_level` text CHECK in 'low'/'medium'/'high'/'critical' default 'medium' (auto from Altman Z: <1.8=critical, <2.7=high, <3.0=medium, >=3.0=low)
- `assessed_at` timestamptz default now()
- `notes` text, `created_at` timestamptz
- RLS: `org_scoped_supplier_financial_health`
- Indexes: `idx_supplier_financial_health_org`, `idx_supplier_financial_health_supplier`

## M10 Geopolitical Risk Profiles (M10.S3)
`geopolitical_risk_profiles`:
- `id` uuid PK
- `organization_id` FK -> organizations
- `region_code` text, UNIQUE per (organization_id, region_code)
- `risk_level` text CHECK in 'low'/'medium'/'high'/'critical' default 'medium'
- `stability_index` numeric(5,2) CHECK 0-100
- `sanctions_active` boolean default false
- `trade_restriction_notes` text
- `updated_at`, `created_at` timestamptz
- RLS: `org_scoped_geopolitical_risk_profiles`
- Indexes: `idx_geopolitical_risk_profiles_org`, `idx_geopolitical_risk_profiles_region`

## M11 Supplier Performance Records (M11.S1)
`supplier_performance_records`:
- `id` uuid PK
- `organization_id` FK -> organizations
- `supplier_id` FK -> suppliers
- `period_start` date, `period_end` date
- `on_time_delivery_rate` numeric(5,2) CHECK 0-100
- `quality_rejection_rate` numeric(5,2) CHECK 0-100
- `lead_time_variance_days` integer default 0
- `responsiveness_score` smallint CHECK 1-5
- `overall_rating` numeric(5,2) CHECK 0-100 default 0 (auto: delivery*0.4 + (100-rejection)*0.3 + lead_time*0.15 + responsiveness*20*0.15)
- `notes` text, `created_at` timestamptz
- RLS: `org_scoped_supplier_performance_records`
- Indexes: `idx_supplier_performance_records_org`, `idx_supplier_performance_records_supplier`

## M11 Part Inventory Levels (M11.S2)
`part_inventory_levels`:
- `id` uuid PK
- `organization_id` FK -> organizations
- `part_id` FK -> parts, UNIQUE per (organization_id, part_id)
- `current_stock` integer default 0
- `safety_stock` integer default 0
- `reorder_point` integer default 0
- `max_stock` integer nullable
- `avg_daily_consumption` numeric(10,2) default 0
- `days_of_supply` numeric(8,2) nullable (auto: current_stock / avg_daily_consumption when consumption > 0)
- `risk_flag` text CHECK in 'adequate'/'low'/'critical'/'stockout' default 'adequate' (auto: stockout if stock<=0, critical if <=safety, low if <=reorder, else adequate)
- `updated_at` timestamptz
- RLS: `org_scoped_part_inventory_levels`
- Indexes: `idx_part_inventory_levels_org`, `idx_part_inventory_levels_part`

## M11 Integrations (M11.S3)
`integrations`:
- `id` uuid PK
- `organization_id` FK -> organizations
- `name` text, UNIQUE per (organization_id, name)
- `type` text CHECK in 'api_connector'/'webhook'/'data_feed'/'manual'
- `status` text CHECK in 'active'/'inactive'/'error' default 'inactive'
- `config` jsonb default '{}'
- `last_sync_at` timestamptz nullable
- `error_message` text nullable
- `created_at` timestamptz
- RLS: `org_scoped_integrations`
- Indexes: `idx_integrations_org`, `idx_integrations_org_status`

## M12 Notifications (M12.S1)
`notifications`:
- `id` uuid PK
- `organization_id` FK -> organizations
- `user_id` FK -> profiles(user_id) (nullable, on delete cascade)
- `title` text
- `message` text
- `type` text CHECK in 'alert'/'incident'/'mitigation'/'compliance'/'system'
- `reference_type` text nullable
- `reference_id` uuid nullable
- `is_read` boolean default false
- `created_at` timestamptz
- RLS: `org_scoped_notifications`
- Indexes: `idx_notifications_org_user_created` (organization_id, user_id, created_at DESC), `idx_notifications_org_is_read` (organization_id, is_read)

## M12 Transportation Routes (M12.S2)
`transportation_routes`:
- `id` uuid PK
- `organization_id` FK -> organizations
- `name` text
- `origin_facility_id` FK -> facilities (nullable, on delete set null)
- `destination_name` text
- `transport_mode` text CHECK in 'ocean'/'air'/'rail'/'road'/'multimodal'
- `estimated_transit_days` integer default 0
- `risk_level` text CHECK in 'low'/'medium'/'high'/'critical' default 'low'
- `active_disruptions` text nullable
- `updated_at`, `created_at` timestamptz
- RLS: `org_scoped_transportation_routes`
- Indexes: `idx_transportation_routes_org`, `idx_transportation_routes_org_mode`, `idx_transportation_routes_org_risk`

## Phase 2 Seed Data (M12.S3.d)
File: `supabase/seed_phase2.sql`

Behavior:
- Requires Phase 1 `supabase/seed.sql` to be applied first.
- Resolves existing org/suppliers/parts/facilities by name.
- Seeds: 4 part financial profiles, 2 mitigation plans with 3 actions each, 2 compliance frameworks with 3 items each, ESG scores for 5 suppliers, financial health for 5 suppliers, geopolitical profiles for 5 regions, 15 performance records (3 per supplier), 6 inventory levels, 3 integrations, 3 transportation routes, 5 notifications.
