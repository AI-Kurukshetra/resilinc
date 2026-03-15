# Seed Data Guide

This document defines the seeding architecture, conventions, and instructions for populating the Resilinc Lite database with demo data. **Future agents adding new features MUST follow this guide** to ensure every new table has seed data and the demo remains compelling for investor/client pitches.

---

## Architecture Overview

Seed data is split into phased, ordered SQL files. Each phase builds on the previous one.

| File | Phase | Tables Covered | Depends On |
|------|-------|----------------|------------|
| `supabase/seed.sql` | Phase 1 — Core | organizations, profiles, organization_members, suppliers (5), facilities (7), parts (8), supplier_parts (11) | At least 1 `auth.users` row |
| `supabase/seed_phase2.sql` | Phase 2 — Extended | part_financial_profiles, mitigation_plans, mitigation_actions, compliance_frameworks, compliance_items, supplier_esg_scores, supplier_financial_health, geopolitical_risk_profiles, supplier_performance_records, part_inventory_levels, integrations, transportation_routes, notifications | Phase 1 |
| `supabase/seed_phase3.sql` | Phase 3 — Risk Pipeline | risk_events (25), risk_event_suppliers (27), supplier_risk_scores (5), alerts (20), alert_events (43), incidents (10), incident_actions (35) | Phase 1 + Phase 2 |
| `supabase/link_user_to_seed_org.sql` | User Linking | Assigns a real auth user to the seeded "Apex Devices Group" org | All seeds |

### Execution Order

```
1. seed.sql
2. seed_phase2.sql
3. seed_phase3.sql
4. link_user_to_seed_org.sql   ← links YOUR user to the seeded org
```

Run in the **Supabase SQL Editor** or via `supabase db reset` (which auto-runs `seed.sql` only — Phase 2/3 must be run manually).

---

## Conventions for All Seed Files

### 1. Idempotency (REQUIRED)

Every seed file MUST be safe to re-run without errors or duplicate rows.

**Techniques by table type:**

| Scenario | Technique | Example |
|----------|-----------|---------|
| Table has `UNIQUE` constraint | `ON CONFLICT ... DO UPDATE` | `supplier_risk_scores`, `integrations` |
| Table has no unique constraint | `IF NOT EXISTS (SELECT ...)` guard | `transportation_routes`, `notifications` |
| Parent + children (no unique) | Guard parent with `SELECT INTO` + `IF x IS NULL` | `mitigation_plans` + `mitigation_actions` |
| Child rows to replace | `DELETE` old children then re-insert | `compliance_items` |

### 2. PL/pgSQL Block Structure

All seed files use `do $$ declare ... begin ... end $$;` blocks with:
- Variable declarations for resolved IDs
- Guard at top: `if demo_org is null then raise notice '...'; return; end if;`
- Resolve existing entities **by name**, never by hardcoded UUID

```sql
do $$
declare
  demo_org uuid;
  s_microcore uuid;
begin
  -- Resolve org (first org by created_at)
  select o.id into demo_org
  from public.organizations o
  order by o.created_at asc limit 1;

  if demo_org is null then
    raise notice 'Seed skipped: no org found.';
    return;
  end if;

  -- Resolve suppliers by name
  select id into s_microcore
  from public.suppliers
  where organization_id = demo_org and name = 'MicroCore Semiconductors';

  -- Insert data...
end $$;
```

### 3. Entity Resolution

| Entity | How to Resolve |
|--------|---------------|
| Organization | `SELECT ... FROM organizations ORDER BY created_at ASC LIMIT 1` |
| User | `SELECT user_id FROM profiles ORDER BY created_at ASC LIMIT 1` |
| Supplier | `SELECT id FROM suppliers WHERE organization_id = ? AND name = ?` |
| Part | `SELECT id FROM parts WHERE organization_id = ? AND part_number = ?` |
| Facility | `SELECT id FROM facilities WHERE organization_id = ? AND name = ?` |

**NEVER hardcode UUIDs.** Always resolve by name/natural key.

### 4. Realistic Demo Data Standards

The seed data tells a coherent story for investor demos:

- **MicroCore Semiconductors (TW)** — Highest risk (score 78.5, trend up). Under pressure from fab fire, ransomware, geopolitical tensions. This is the "hero supplier" that demonstrates platform value.
- **Pacific PCB Works (MY)** — Moderate risk (52.3, flat). Monsoon flooding and quality issues.
- **Nordic Power Systems (DE)** — Lowest risk (35.0, trend down). Strong performer, manageable regulatory exposure.
- **Sierra Optics Manufacturing (MX)** — Elevated risk (68.75, up). Financial weakness + quality + logistics.
- **Atlas Logistics Components (US)** — Moderate risk (45.2, flat). Tariff and port congestion exposure.

When adding new data, maintain this narrative consistency.

---

## How to Add Seed Data for a New Feature

When you create a new table (migration), you MUST also add seed data. Follow these steps:

### Step 1: Determine the Right Seed File

- If your table is **foundational** (referenced by many other tables): add to `seed.sql`
- If your table is an **extended feature** (M8+): add to the appropriate phase file
- For **new phases**, create `supabase/seed_phase{N}.sql` following the same pattern

### Step 2: Design the Data

| Guideline | Details |
|-----------|---------|
| **Volume** | 5-25 rows per table. Enough to look populated, not so many it's overwhelming |
| **Distribution** | Spread across statuses/types (e.g., 30% open, 40% in-progress, 30% closed) |
| **Realism** | Use industry-specific terminology. Reference real standards, regions, and scenarios |
| **Time spread** | Use `now() - interval 'N days'` to spread data across 60-90 days |
| **Relationships** | Link to existing suppliers/parts/facilities. Maintain the risk narrative above |
| **Severity spread** | Weight toward middle (S2-S4) with fewer extremes (S1, S5) |

### Step 3: Write Idempotent SQL

```sql
-- Template for adding to an existing seed phase file:

-- Resolve parent entities (already declared in the block)
-- e.g., demo_org, s_microcore, s_pacific, etc. are already available

-- Guard: check if data already exists
if not exists (select 1 from public.your_new_table where organization_id = demo_org and name = 'First Record') then
  insert into public.your_new_table (organization_id, ...)
  values
    (demo_org, ...),
    (demo_org, ...);
end if;

-- OR if you have a unique constraint:
insert into public.your_new_table (organization_id, some_unique_col, ...)
values (demo_org, 'value', ...)
on conflict (organization_id, some_unique_col) do update
  set col1 = excluded.col1,
      col2 = excluded.col2;
```

### Step 4: Update This Document

After adding seed data, update the table at the top of this file and add a section below describing what was seeded and why.

### Step 5: Update SCHEMA.md

Add a seed data summary to the relevant section in `doc/SCHEMA.md`.

---

## Phase Details

### Phase 1 — Core Network (`seed.sql`)

Creates the foundation all other seeds depend on:
- 1 organization: **Apex Devices Group**
- 1 profile + owner membership
- 5 suppliers across TW, MY, DE, MX, US
- 7 facilities with real GPS coordinates
- 8 parts with criticality ratings 2-5
- 11 supplier-part tier links (tier 1/2/3)

### Phase 2 — Extended Features (`seed_phase2.sql`)

Populates M8-M12 tables:
- 4 part financial profiles (annual spend, unit cost, lead times)
- 2 mitigation plans with 3 actions each (one active, one draft)
- 2 compliance frameworks with 3 items each (ISO 28000, EU Conflict Minerals)
- 5 supplier ESG scores (E/S/G breakdown + composite)
- 5 supplier financial health records (credit rating, Altman Z, revenue trend)
- 5 geopolitical risk profiles (TW=high, MY=low, DE=low, MX=medium, US=low)
- 15 supplier performance records (3 periods x 5 suppliers)
- 6 part inventory levels (2 critical, 1 low, 3 adequate)
- 3 integrations (SAP connector, weather webhook, manual import)
- 3 transportation routes (ocean TW→US, air MY→DE, road DE→DE)
- 5 notifications (system, alert, compliance, mitigation, incident)

### Phase 3 — Risk Pipeline (`seed_phase3.sql`)

Populates the core risk-response workflow:
- **25 risk events** across 6 categories: geopolitical (4), cyber (2), natural disaster (4), supply disruption (7), quality (3), regulatory (5) — spread over 90 days
- **27 risk-event-supplier links** mapping events to affected suppliers with impact levels
- **5 supplier risk scores** with trend and explanation JSON
- **20 alerts**: 7 open, 6 acknowledged, 7 resolved — severity S1-S5
- **43 alert events**: generated (20) + escalated (3) + acknowledged (13) + resolved (7)
- **10 incidents**: 3 open, 4 in-progress, 3 closed — with owner assignments
- **35 incident actions**: mix of todo/doing/done/blocked across all active/closed incidents

### User Linking (`link_user_to_seed_org.sql`)

Connects a real authenticated user to the seeded org:
- Finds user by email
- Adds them as owner of "Apex Devices Group"
- Removes their auto-created personal org (the empty one)
- Must be updated with the target user's email address before running

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `duplicate key` error on re-run | Missing `ON CONFLICT` or `IF NOT EXISTS` guard | Add idempotency (see conventions above) |
| Seeded data not visible in app | User is in a different org than the seeded one | Run `link_user_to_seed_org.sql` |
| `null` values on dashboard | Seed file didn't run or failed silently | Check for `raise notice 'skipped'` in SQL output; verify prerequisites |
| Phase 2/3 data missing | Only `seed.sql` runs on `supabase db reset` | Manually run Phase 2 and 3 in SQL editor |
| Foreign key violation | Phase ordering wrong | Always run in order: 1 → 2 → 3 → link |

---

## Checklist for Future Agents

When adding a new feature with a new table:

- [ ] Create migration with table + RLS + indexes
- [ ] Add seed data to appropriate phase file (or create new phase)
- [ ] Ensure idempotency (test by running seed file twice)
- [ ] Use realistic demo data that fits the MicroCore/Pacific/Nordic/Sierra/Atlas narrative
- [ ] Spread data across statuses and time ranges
- [ ] Update this file (`doc/SEEDING.md`) with what was added
- [ ] Update `doc/SCHEMA.md` seed section
- [ ] Run `pnpm lint && pnpm typecheck` to verify no regressions
