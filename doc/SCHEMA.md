# SCHEMA

## Migrations
- `supabase/migrations/20260314110000_init_resilinc_mvp.sql`
- `supabase/migrations/20260314170000_m2_hardening.sql`

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
- `incidents`
- `incident_actions`

## Key Relationships
- Organization -> suppliers, facilities, parts, risk events, alerts, incidents (`organization_id` FK)
- Supplier -> facilities (`facilities.supplier_id`)
- Supplier <-> parts (`supplier_parts` join with `tier_level`)
- Risk events <-> suppliers (`risk_event_suppliers`)
- Alerts optionally reference supplier + risk event
- Incidents reference alerts; incident actions reference incidents

## RLS Model
- All business tables have RLS enabled.
- Org-scoped tables enforce membership with `public.is_org_member(organization_id)`.
- Owner checks now use `public.is_org_owner(organization_id)` for membership mutations.
- Profiles are self-scoped (`user_id = (select auth.uid())`).

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

## Storage
- Private bucket: `incident-evidence`.
