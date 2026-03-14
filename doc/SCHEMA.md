# SCHEMA

## Migration
- `supabase/migrations/20260314110000_init_resilinc_mvp.sql`

## Tables
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
- Org -> suppliers/facilities/parts/events/alerts/incidents (1:N)
- Supplier <-> parts via `supplier_parts` (M:N)
- Risk events <-> suppliers via `risk_event_suppliers` (M:N)
- Alerts link to optional supplier and event
- Incidents link to alerts, actions link to incidents

## RLS Summary
- All business tables have RLS enabled.
- Access controlled by `is_org_member(organization_id)` helper.
- Profiles are self-scoped by `auth.uid()`.
- Org creation is allowed for authenticated creator only.

## Storage
- Private bucket: `incident-evidence`.
