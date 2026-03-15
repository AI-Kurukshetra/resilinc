# End-to-End Development Plan (Blueprint-Driven)

Source references:
- `resilinc_blueprint.pdf` / `doc/resilinc_blueprint.txt`
- `AGENTS.md`
- `Mahakurukshetra.md`

## Goal
Deliver a demo-ready supply-chain risk intelligence MVP that supports org auth, supplier mapping, disruption ingestion, risk scoring, alerting, incident response tracking, seeded data, and Vercel deployment.

## Delivery Order (Strict)
1. M1 Platform & Auth Foundation
2. M2 Core Data and Supply Chain Mapping
3. M3 Risk Ingestion + MCP Enrichment
4. M4 Risk Scoring, Alerts, and Incident Workflows
5. M5 Dashboard and Workflow UI
6. M6 Testing and Quality Gates
7. M7 Deployment, Demo, and Submission Pack

## Module Breakdown

### M1 — Platform & Auth Foundation
Objective: Make secure org-scoped access work end-to-end.

Subtasks:
- M1.S1 Supabase SSR client implementation
- M1.S2 Auth flows (login/signup/logout/reset)
- M1.S3 Protected dashboard session guard

Sub-subtasks:
- M1.S1.a Implement `lib/supabase/client.ts` with `createBrowserClient`
- M1.S1.b Implement `lib/supabase/server.ts` with `createServerClient` + cookies
- M1.S1.c Implement `lib/supabase/middleware.ts` + root `middleware.ts` session refresh
- M1.S2.a Build auth pages and form validation schemas
- M1.S2.b Add server actions/API handlers for auth operations
- M1.S2.c Add redirect rules (unauthenticated -> `/login`, authenticated -> `/overview`)
- M1.S3.a Build `(dashboard)/layout.tsx` auth guard
- M1.S3.b Create minimal profile bootstrap on first login
- M1.S3.c Add unauthorized/error state UI components

Acceptance:
- User can sign in/out and access only org-scoped dashboard routes.

### M2 — Core Data and Supply Chain Mapping
Objective: Model suppliers, facilities, parts, and tier relationships.

Subtasks:
- M2.S1 Migration hardening and seed strategy
- M2.S2 CRUD APIs for suppliers/facilities/parts
- M2.S3 Supply chain mapping service

Sub-subtasks:
- M2.S1.a Validate migration on local Supabase and fix policy gaps
- M2.S1.b Build seed SQL/script for org, suppliers, facilities, parts
- M2.S1.c Document sample dataset assumptions in `doc/SCHEMA.md`
- M2.S2.a Add API routes/server actions for create/update/list entities
- M2.S2.b Add Zod input validation and structured errors
- M2.S2.c Enforce org-level authorization in all handlers
- M2.S3.a Implement supplier-part-tier linking logic
- M2.S3.b Build exposure query helpers (supplier -> impacted parts)
- M2.S3.c Add mapping response DTO for UI consumption

Acceptance:
- Demo org can browse supplier network with seeded hierarchy.

### M3 — Risk Ingestion + MCP Enrichment
Objective: Continuously ingest and normalize disruption events.

Subtasks:
- M3.S1 Risk event ingestion pipeline
- M3.S2 MCP enrichment adapters
- M3.S3 Deduplication and provenance tracking

Sub-subtasks:
- M3.S1.a Create ingestion endpoint/job contract
- M3.S1.b Normalize event payload (type, severity, confidence, region)
- M3.S1.c Map events to affected suppliers/facilities
- M3.S2.a Build web search adapter (`search_query`, `open`, `find`)
- M3.S2.b Build weather adapter for disaster risk
- M3.S2.c Standardize enrichment payload schema and confidence rubric
- M3.S3.a Add dedupe keys (event_type + region + observed_at + source)
- M3.S3.b Persist source metadata for auditability
- M3.S3.c Add fallback state for low-confidence inputs

Acceptance:
- Ingestion creates clean, traceable `risk_events` and links impact scope.

### M4 — Risk Scoring, Alerts, and Incident Workflows
Objective: Convert events into actionable prioritized response.

Subtasks:
- M4.S1 Risk scoring engine
- M4.S2 Alert generation and acknowledgment
- M4.S3 Incident and action management

Sub-subtasks:
- M4.S1.a Implement weighted scoring formula (severity, confidence, criticality)
- M4.S1.b Write score trend logic (`up/down/flat`)
- M4.S1.c Persist explanation JSON for transparency
- M4.S2.a Generate alerts from threshold rules
- M4.S2.b Implement alert acknowledgment/resolution endpoints
- M4.S2.c Add owner attribution and timeline fields
- M4.S3.a Create incident from critical alert
- M4.S3.b Generate playbook actions with due windows
- M4.S3.c Implement action state transitions and closure rules

Acceptance:
- Critical event -> score update -> alert -> incident action flow works.

### M5 — Dashboard and Workflow UI
Objective: Provide clear operational UI for all core journeys.

Subtasks:
- M5.S1 Overview dashboard
- M5.S2 Supplier and alert detail screens
- M5.S3 Incident board and report views

Sub-subtasks:
- M5.S1.a Build KPI cards (high-risk suppliers, open alerts, open incidents)
- M5.S1.b Build latest disruption feed and severity filters
- M5.S1.c Add skeleton/loading and error states
- M5.S2.a Build supplier list with risk score trend
- M5.S2.b Build alert detail drawer/page with source evidence
- M5.S2.c Add acknowledgment and ownership actions
- M5.S3.a Build incident Kanban/list by status
- M5.S3.b Build action checklist editor
- M5.S3.c Build report summary page for demo export

Acceptance:
- User can execute full workflow in UI without manual DB operations.

### M6 — Testing and Quality Gates
Objective: Ensure reliability and no critical regressions.

Subtasks:
- M6.S1 Unit tests for validation/business logic
- M6.S2 E2E tests for critical journeys
- M6.S3 Preflight + CI checklist

Sub-subtasks:
- M6.S1.a Add tests for Zod schemas and scoring logic
- M6.S1.b Add tests for API handlers (happy + error path)
- M6.S1.c Add tests for incident state transitions
- M6.S2.a E2E: auth login + protected route
- M6.S2.b E2E: event ingestion -> alert visible
- M6.S2.c E2E: acknowledge alert -> create/close incident
- M6.S3.a Run `scripts/preflight.sh`
- M6.S3.b Run lint/typecheck/test/test:e2e
- M6.S3.c Log residual risks in `doc/PROGRESS.md`

Acceptance:
- Core paths pass with reproducible checks.

### M7 — Deployment, Demo, and Submission Pack
Objective: Ship and present confidently in hackathon constraints.

Subtasks:
- M7.S1 Vercel deployment setup
- M7.S2 Demo data and script stabilization
- M7.S3 Submission package preparation

Sub-subtasks:
- M7.S1.a Configure Vercel env vars and production settings
- M7.S1.b Verify build and runtime health endpoints
- M7.S1.c Execute post-deploy smoke run
- M7.S2.a Ensure seed script runs cleanly on target Supabase
- M7.S2.b Validate dashboard is populated on first login
- M7.S2.c Freeze stable demo account/test script
- M7.S3.a Prepare 5-minute demo flow script
- M7.S3.b Prepare GitHub + Vercel + video + Product Hunt links
- M7.S3.c Final review against judging criteria checklist

Acceptance:
- Working live URL + demo-ready journey + complete submission assets.

## Subtask Prompts (Copy-Paste Ready)

### M1.S1 Prompt
`$api-endpoint Implement M1.S1 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Build Supabase SSR client utilities in lib/supabase/client.ts, lib/supabase/server.ts, lib/supabase/middleware.ts, and wire root middleware.ts. Keep strict TypeScript and org-safe session handling. Update doc/TASKS.md, doc/PROGRESS.md, doc/CHANGELOG.md, and doc/DECISIONS.md after completion.`

### M1.S2 Prompt
`$api-endpoint Implement M1.S2 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Build auth pages and handlers (login/signup/logout/reset) with Zod validation and robust redirect rules for authenticated vs unauthenticated users. Ensure errors are explicit and testable.`

### M1.S3 Prompt
`$frontend-design Implement M1.S3 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Add dashboard auth guard layout, first-login profile bootstrap UX, and unauthorized/error UI states. Keep mobile-first and accessible components.`

### M2.S1 Prompt
`$db-migration Implement M2.S1 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Validate existing migration, patch policy/index gaps, and create seed script strategy with realistic suppliers/facilities/parts. Update doc/SCHEMA.md.`

### M2.S2 Prompt
`$api-endpoint Implement M2.S2 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Add CRUD API routes/server actions for suppliers, facilities, and parts with org-scoped RLS-safe access and Zod validation.`

### M2.S3 Prompt
`$api-endpoint Implement M2.S3 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Build supplier-part-tier mapping service and exposure query helpers returning UI-ready DTOs.`

### M3.S1 Prompt
`$api-endpoint Implement M3.S1 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Build risk ingestion job/endpoint and normalize raw inputs into risk_events + risk_event_suppliers links.`

### M3.S2 Prompt
`$risk-intelligence-ingestion Implement M3.S2 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Add MCP enrichment adapters for web search and weather, and standardize the normalized payload schema with confidence scoring.`

### M3.S3 Prompt
`$risk-intelligence-ingestion Implement M3.S3 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Add dedupe logic and source provenance persistence; define fallback behavior for low-confidence events.`

### M4.S1 Prompt
`$risk-scoring Implement M4.S1 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Create weighted risk scoring and trend logic, and persist explanation payloads for each supplier score.`

### M4.S2 Prompt
`$api-endpoint Implement M4.S2 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Generate alerts from threshold breaches and build acknowledgement/resolution endpoints with owner/timeline tracking.`

### M4.S3 Prompt
`$incident-response-playbook Implement M4.S3 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Build incident creation from alerts and playbook action generation with status transitions and closure rules.`

### M5.S1 Prompt
`$frontend-design Implement M5.S1 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Build overview dashboard KPI cards, disruption feed, and severity filters with skeleton/loading/error states.`

### M5.S2 Prompt
`$frontend-design Implement M5.S2 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Build supplier list/detail and alert detail views with source evidence and acknowledgment interactions.`

### M5.S3 Prompt
`$frontend-design Implement M5.S3 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Build incident board, action checklist editor, and report summary view for demo export.`

### M6.S1 Prompt
`$tester Implement M6.S1 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Add unit tests for validators, scoring logic, API handlers, and incident transition rules.`

### M6.S2 Prompt
`$agent-browser Implement M6.S2 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Add E2E specs for login/protected route, ingestion-to-alert visibility, and alert-to-incident closure flow.`

### M6.S3 Prompt
`$pr-review Implement M6.S3 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Run risk-focused review and verify preflight + lint + typecheck + unit + e2e checks. Provide severity-ordered findings.`

### M7.S1 Prompt
`$api-endpoint Implement M7.S1 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Finalize deployment configuration and production readiness checks for Vercel + Supabase.`

### M7.S2 Prompt
`$db-migration Implement M7.S2 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Finalize seed data consistency for demo-first experience and validate first-login populated dashboards.`

### M7.S3 Prompt
`$pr-review Implement M7.S3 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md. Prepare final submission checklist, verify judging criteria alignment, and log release readiness.`

---

## Phase 2 — Blueprint Feature Completion (M8–M12)

### Phase 2 Goal
Complete all partially implemented and missing blueprint PRD features: supply chain visualization, historical analytics, business impact analysis, risk mitigation planning, compliance tracking, ESG/financial/geopolitical risk dimensions, supplier performance, inventory risk, integration management, communication hub, transportation risk, and natural disaster monitoring.

### Phase 2 Delivery Order (Strict)
8. M8 Visual Intelligence and Historical Analysis
9. M9 Risk Mitigation and Compliance
10. M10 Extended Risk Dimensions
11. M11 Operational Features
12. M12 Communication, Transportation, and Final Polish

### Phase 2 Dependencies
- Install `recharts` and `react-force-graph-2d` npm packages before M8
- Each milestone has one migration file — apply to remote Supabase SQL Editor after creating
- M8 uses only existing tables (except M8.S3 which adds `part_financial_profiles`)
- Within each milestone, subtasks sharing the same migration can be parallelized after migration is applied

### Phase 2 Conventions (MUST follow)
All new code MUST follow existing patterns exactly:

**Service layer** (`lib/[feature]/service.ts`):
- Custom `*ServiceError` class extending Error with `code`, `message`, `status` fields
- Private `*Row` interfaces (snake_case DB fields) and exported `*DTO` interfaces (camelCase)
- Private `to*Dto(row)` converter functions
- Async functions taking `(supabase: SupabaseClient, input: { organizationId: string, ... })`
- List queries return `{ items: DTO[], pagination: { limit, offset, total } }`
- Reference: `lib/alerts/service.ts`, `lib/incidents/service.ts`

**API routes** (`app/api/[resource]/route.ts`):
- Always call `requireOrgApiContext()` first from `lib/api/org-context.ts`
- Validate with Zod `.safeParse()`, return `zodFieldErrors()` on failure
- Use `apiSuccess(data, status)` and `apiError({code, message, fieldErrors}, status)` from `lib/api/responses.ts`
- Use `apiErrorFromDbError()` from `lib/api/db-errors.ts` for DB errors
- Reference: `app/api/suppliers/route.ts`, `app/api/alerts/route.ts`

**Validation** (`lib/validations/[feature].ts`):
- Zod schemas with `PaginationSchema` (limit 1-100, offset >=0)
- `emptyStringToUndefined` preprocessor for optional string fields
- CHECK-constrained enums as `z.enum()`
- Export `z.infer<typeof Schema>` types
- Reference: `lib/validations/alerts.ts`, `lib/validations/supply-chain.ts`

**Dashboard pages** (`app/(dashboard)/[feature]/page.tsx`):
- Async server components with `Metadata` export
- Call `getDashboardContext()` from `lib/dashboard/context.ts`
- Parallel data loading with `Promise.all()`
- `mac-surface rounded-2xl p-4` for card containers
- `mac-pill` for badges/labels
- Error states for missing context and DB errors
- Add `loading.tsx` and `error.tsx` for every route
- Reference: `app/(dashboard)/suppliers/page.tsx`, `app/(dashboard)/reports/page.tsx`

**Client components** (`app/(dashboard)/[feature]/_components/*.tsx`):
- `"use client"` directive, `useRouter`, `useState`, `useTransition`
- `router.refresh()` after mutations
- Emerald feedback for success, rose for errors
- `disabled={isPending}` on buttons
- Reference: `app/(dashboard)/suppliers/_components/supplier-create-form.tsx`

**Migrations** (`supabase/migrations/YYYYMMDDHHMMSS_description.sql`):
- UUID PKs with `gen_random_uuid()`, `organization_id` FK, cascading deletes
- CHECK constraints for enum columns
- `alter table enable row level security`
- `create policy "org_scoped_*" using (public.is_org_member(organization_id))`
- Composite indexes on `(organization_id, key_column)`
- Reference: `supabase/migrations/20260314110000_init_resilinc_mvp.sql`

---

### M8 — Visual Intelligence and Historical Analysis
Objective: Add supply chain network graph visualization, historical risk trend analytics, and business impact quantification. These are the highest demo-impact features because they turn existing backend data into compelling visualizations.

Subtasks:
- M8.S1 Supply chain network graph UI
- M8.S2 Historical risk analytics
- M8.S3 Business impact analysis

Sub-subtasks:
- M8.S1.a Build server page `app/(dashboard)/supply-chain/page.tsx` fetching network overview from existing `listSupplierNetworkOverview()` in `lib/supply-chain/mapping.ts`
- M8.S1.b Build client `network-graph.tsx` using `react-force-graph-2d` (nodes = suppliers colored by criticality/risk-score, edges = supplier-part tier links, node size by criticality)
- M8.S1.c Build client `exposure-panel.tsx` — click supplier node to show exposure details (facilities, parts, risk score) using existing `/api/supply-chain/exposure/[supplierId]` endpoint
- M8.S1.d Add `loading.tsx`, `error.tsx` and update `dashboard-nav.tsx` with "Supply Chain" link
- M8.S2.a Build service `lib/analytics/historical.ts` with `getRiskEventTimeSeries(supabase, { organizationId, dateRange, granularity })` that groups `risk_events` by week/month and severity, and `getScoreTrendHistory()` that queries `supplier_risk_scores` over time
- M8.S2.b Build Zod validation `lib/validations/analytics.ts` with `HistoricalQuerySchema` (fields: startDate, endDate, granularity enum day/week/month, supplierId optional UUID)
- M8.S2.c Build API endpoint `GET /api/analytics/risk-trends` returning time-series data array
- M8.S2.d Build analytics dashboard page `app/(dashboard)/analytics/page.tsx` with `risk-trend-chart.tsx` (recharts LineChart + BarChart for severity distribution) and `disruption-timeline.tsx` (event list sorted by observedAt)
- M8.S2.e Update `dashboard-nav.tsx` with "Analytics" link
- M8.S3.a Create migration `supabase/migrations/20260315100000_m8_analytics_impact.sql` with table `part_financial_profiles` (id uuid PK, organization_id FK, part_id FK unique per org, annual_spend numeric(14,2) default 0, unit_cost numeric(10,2), annual_volume integer, lead_time_days integer, currency text default 'USD', updated_at timestamptz)
- M8.S3.b Build service `lib/impact-analysis/service.ts` with `calculateBusinessImpact(supabase, { organizationId, supplierId })` — sums annual_spend of supplier's linked parts via supplier_parts, estimates disruption cost = annual_spend × (riskScore/100), returns revenue-at-risk totals
- M8.S3.c Build validation `lib/validations/impact-analysis.ts` with schemas for part financial profile create/update and impact query params
- M8.S3.d Build API endpoints: `GET /api/impact-analysis/[supplierId]` returning impact DTO, `GET/PUT /api/parts/[partId]/financial` for financial profile CRUD
- M8.S3.e Extend `app/(dashboard)/suppliers/[supplierId]/page.tsx` with business impact summary section showing revenue-at-risk and disruption cost estimate

Acceptance:
- Interactive supply chain network graph renders with clickable supplier nodes
- Analytics page shows risk event trends over time with recharts charts
- Supplier detail shows estimated revenue at risk based on part financial profiles
- No new tables needed for M8.S1/M8.S2 — only `part_financial_profiles` for M8.S3

---

### M9 — Risk Mitigation and Compliance
Objective: Add risk mitigation planning workflows (PRD must-have) and compliance/regulatory tracking. These add meaningful workflow depth to the platform.

Subtasks:
- M9.S1 Risk mitigation planning
- M9.S2 Compliance and regulatory tracking

Sub-subtasks:
- M9.S1.a Create migration `supabase/migrations/20260315110000_m9_mitigation_compliance.sql` with tables: `mitigation_plans` (id uuid PK, organization_id FK, supplier_id FK nullable, alert_id FK nullable, title text, description text, strategy text CHECK in 'avoid'/'mitigate'/'transfer'/'accept', status text CHECK in 'draft'/'active'/'completed'/'archived' default 'draft', priority smallint 1-5 default 3, owner_id FK nullable to profiles, target_date timestamptz nullable, completed_at timestamptz nullable, created_at, updated_at), `mitigation_actions` (id uuid PK, plan_id FK to mitigation_plans, organization_id FK, title text, status text CHECK in 'pending'/'in_progress'/'completed'/'cancelled' default 'pending', owner_id FK nullable, due_date timestamptz nullable, notes text, created_at). Add RLS policies `org_scoped_mitigation_plans` and `org_scoped_mitigation_actions` using `is_org_member()`. Add indexes on (organization_id, status) for both tables.
- M9.S1.b Build service `lib/mitigation/service.ts` following `lib/alerts/service.ts` pattern. Include: `MitigationServiceError` class, `MitigationPlanDTO`/`MitigationActionDTO` interfaces, `createPlan()`, `updatePlan()`, `listPlans()` with pagination + status/priority filters, `getPlanDetail()` with embedded actions, `addAction()`, `updateActionStatus()`, `completePlan()` (validates all actions completed first)
- M9.S1.c Build validation `lib/validations/mitigation.ts` with `MitigationPlanCreateSchema` (title, description, strategy enum, priority 1-5, supplierId optional UUID, alertId optional UUID, targetDate optional), `MitigationPlanUpdateSchema` (.partial with .refine at least one field), `MitigationPlanListQuerySchema` extending PaginationSchema (status optional, priority optional, supplierId optional), `MitigationActionCreateSchema` (title, dueDate optional, ownerId optional), `MitigationActionStatusSchema` (status enum)
- M9.S1.d Build API routes: `app/api/mitigation-plans/route.ts` (GET list, POST create), `app/api/mitigation-plans/[planId]/route.ts` (GET detail, PATCH update)
- M9.S1.e Build API routes: `app/api/mitigation-plans/[planId]/actions/route.ts` (GET list, POST add), `app/api/mitigation-plans/[planId]/actions/[actionId]/status/route.ts` (PATCH status transition)
- M9.S1.f Build dashboard pages: `app/(dashboard)/mitigation/page.tsx` (server component — list plans with status filter pills like alerts page, show strategy badge, priority indicator, linked supplier name), `app/(dashboard)/mitigation/[planId]/page.tsx` (plan detail with action checklist, completion button), add `loading.tsx` and `error.tsx` for both
- M9.S1.g Build client components: `app/(dashboard)/mitigation/_components/plan-create-form.tsx` (form posting to POST /api/mitigation-plans with strategy select, priority slider, optional supplier/alert select), `app/(dashboard)/mitigation/_components/plan-action-list.tsx` (action checklist with status transitions via PATCH endpoint, add action form)
- M9.S2.a Add to M9 migration: `compliance_frameworks` (id uuid PK, organization_id FK, name text unique per org, description text, category text CHECK in 'regulatory'/'industry'/'internal'/'esg', created_at), `compliance_items` (id uuid PK, framework_id FK to compliance_frameworks, organization_id FK, supplier_id FK nullable, requirement text, status text CHECK in 'not_assessed'/'compliant'/'non_compliant'/'partially_compliant'/'exempted' default 'not_assessed', evidence_notes text, assessed_at timestamptz nullable, next_review_date timestamptz nullable, created_at). Add RLS + indexes.
- M9.S2.b Build service `lib/compliance/service.ts` with: `ComplianceServiceError`, `FrameworkDTO`/`ComplianceItemDTO`, `createFramework()`, `listFrameworks()` with category filter, `listItems()` per framework with status filter, `updateItemStatus()`, `getComplianceSummary()` (returns per-framework percentage: count compliant / total items × 100)
- M9.S2.c Build validation `lib/validations/compliance.ts` with schemas for framework create (name, description, category enum), item create (requirement, supplierId optional), item status update (status enum, evidenceNotes, nextReviewDate), list queries with pagination
- M9.S2.d Build API routes: `app/api/compliance/frameworks/route.ts` (GET/POST), `app/api/compliance/frameworks/[frameworkId]/items/route.ts` (GET/POST), `app/api/compliance/frameworks/[frameworkId]/items/[itemId]/route.ts` (PATCH status)
- M9.S2.e Build dashboard pages: `app/(dashboard)/compliance/page.tsx` (framework cards showing compliance percentage as progress bars, category badges), `app/(dashboard)/compliance/[frameworkId]/page.tsx` (items list grouped by supplier, status badges), add `loading.tsx` and `error.tsx`
- M9.S2.f Build client components: `app/(dashboard)/compliance/_components/compliance-status-badge.tsx` (status → color mapping: compliant=emerald, non_compliant=rose, partially=amber, not_assessed=slate, exempted=blue), `app/(dashboard)/compliance/_components/item-assessment-form.tsx` (inline status update + evidence notes + next review date)
- M9.S2.g Update `dashboard-nav.tsx` to add "Mitigation" and "Compliance" links

Acceptance:
- Full CRUD for mitigation plans with strategy classification and action checklists
- Compliance frameworks with per-item per-supplier status tracking
- Dashboard shows compliance percentage per framework
- Plan completion gated on all actions completed

---

### M10 — Extended Risk Dimensions
Objective: Add ESG, financial, and geopolitical risk scoring dimensions to broaden risk intelligence coverage.

Subtasks:
- M10.S1 ESG risk evaluation
- M10.S2 Financial risk assessment
- M10.S3 Geopolitical risk enhancement

Sub-subtasks:
- M10.S1.a Create migration `supabase/migrations/20260315120000_m10_extended_risk.sql` with table `supplier_esg_scores` (id uuid PK, organization_id FK, supplier_id FK unique per supplier, environmental_score numeric(5,2) CHECK 0-100 default 0, social_score numeric(5,2) CHECK 0-100 default 0, governance_score numeric(5,2) CHECK 0-100 default 0, composite_score numeric(5,2) CHECK 0-100 default 0, assessment_date timestamptz default now(), notes text, created_at). Add RLS + indexes.
- M10.S1.b Build service `lib/esg/service.ts` with: `EsgServiceError`, `EsgScoreDTO`, `upsertEsgScore()` (auto-computes composite = environmental*0.4 + social*0.35 + governance*0.25), `getEsgScore()` per supplier, `listEsgScores()` for all org suppliers
- M10.S1.c Build validation `lib/validations/esg.ts` with `EsgScoreUpsertSchema` (environmentalScore, socialScore, governanceScore — all numeric 0-100, notes optional)
- M10.S1.d Build API routes: `app/api/esg-scores/route.ts` (GET list), `app/api/esg-scores/[supplierId]/route.ts` (GET/PUT upsert)
- M10.S1.e Extend `app/(dashboard)/suppliers/[supplierId]/page.tsx` to show ESG score section with E/S/G breakdown bars and composite score. Add `app/(dashboard)/suppliers/_components/esg-score-card.tsx` client component
- M10.S2.a Add to M10 migration: `supplier_financial_health` (id uuid PK, organization_id FK, supplier_id FK unique, credit_rating text CHECK in 'AAA'/'AA'/'A'/'BBB'/'BB'/'B'/'CCC'/'CC'/'C'/'D'/'NR', altman_z_score numeric(6,3), revenue_trend text CHECK in 'growing'/'stable'/'declining'/'unknown', debt_to_equity numeric(6,3), days_payable_outstanding integer, financial_risk_level text CHECK in 'low'/'medium'/'high'/'critical' default 'medium', assessed_at timestamptz default now(), notes text, created_at). Add RLS + indexes.
- M10.S2.b Build service `lib/financial-risk/service.ts` with: `FinancialRiskServiceError`, `FinancialHealthDTO`, `upsertFinancialHealth()` (auto-computes financial_risk_level from Altman Z: <1.8=critical, <2.7=high, <3.0=medium, >=3.0=low), `getFinancialHealth()`, `listFinancialHealth()`
- M10.S2.c Build validation `lib/validations/financial-risk.ts`
- M10.S2.d Build API routes: `app/api/financial-risk/route.ts` (GET list), `app/api/financial-risk/[supplierId]/route.ts` (GET/PUT)
- M10.S2.e Extend supplier detail page with financial health card. Add `app/(dashboard)/suppliers/_components/financial-health-card.tsx` showing credit rating badge, Z-score, revenue trend arrow, risk level indicator
- M10.S3.a Add to M10 migration: `geopolitical_risk_profiles` (id uuid PK, organization_id FK, region_code text unique per org, risk_level text CHECK in 'low'/'medium'/'high'/'critical' default 'medium', stability_index numeric(5,2) CHECK 0-100, sanctions_active boolean default false, trade_restriction_notes text, updated_at, created_at). Add RLS + indexes.
- M10.S3.b Build service `lib/geopolitical/service.ts` with: `GeoRiskServiceError`, `GeoRiskProfileDTO`, `upsertGeoRiskProfile()`, `listGeoRiskProfiles()`, `getGeoRiskByRegion()`, `getSupplierGeoRisk()` (joins supplier.region_code to geopolitical profile)
- M10.S3.c Build validation `lib/validations/geopolitical.ts`
- M10.S3.d Build API routes: `app/api/geopolitical-risk/route.ts` (GET list/POST create), `app/api/geopolitical-risk/[regionCode]/route.ts` (GET/PUT)
- M10.S3.e Add `app/(dashboard)/analytics/_components/geo-risk-map.tsx` — region risk summary table/cards on analytics page showing region_code, risk_level, stability_index, sanctions flag, and count of affected suppliers. Seed geopolitical profiles for demo regions: TW (high — semiconductor dependency + strait risk), MY (medium), DE (low), MX (medium), US (low)

Acceptance:
- Suppliers have ESG scores with E/S/G breakdown and auto-computed composite
- Financial health indicators with Altman Z-score auto-classification
- Region-level geopolitical risk profiles linked to suppliers via region_code
- All three dimensions visible on supplier detail page

---

### M11 — Operational Features
Objective: Add supplier performance tracking, inventory risk assessment, and integration management stubs.

Subtasks:
- M11.S1 Supplier performance tracking
- M11.S2 Inventory risk assessment
- M11.S3 Integration management

Sub-subtasks:
- M11.S1.a Create migration `supabase/migrations/20260315130000_m11_operations.sql` with table `supplier_performance_records` (id uuid PK, organization_id FK, supplier_id FK, period_start date, period_end date, on_time_delivery_rate numeric(5,2) CHECK 0-100, quality_rejection_rate numeric(5,2) CHECK 0-100, lead_time_variance_days integer, responsiveness_score smallint CHECK 1-5, overall_rating numeric(5,2), notes text, created_at). Add RLS + indexes on (organization_id, supplier_id).
- M11.S1.b Build service `lib/performance/service.ts` with: `PerformanceServiceError`, `PerformanceRecordDTO`, `addPerformanceRecord()` (auto-computes overall_rating = delivery*0.4 + (100-quality_rejection)*0.3 + max(0, 100-abs(lead_time_variance)*5)*0.15 + responsiveness*20*0.15), `listPerformanceHistory()` per supplier with pagination, `getPerformanceSummary()` aggregating latest period
- M11.S1.c Build validation `lib/validations/performance.ts`
- M11.S1.d Build API routes: `app/api/performance/route.ts` (GET list/POST create), `app/api/performance/[supplierId]/route.ts` (GET history for supplier)
- M11.S1.e Extend `app/(dashboard)/suppliers/[supplierId]/page.tsx` with performance section showing latest record metrics and overall rating. Add `app/(dashboard)/suppliers/_components/performance-chart.tsx` client component with recharts sparkline showing delivery/quality trends over periods
- M11.S2.a Add to M11 migration: `part_inventory_levels` (id uuid PK, organization_id FK, part_id FK unique per org+part, current_stock integer default 0, safety_stock integer default 0, reorder_point integer default 0, max_stock integer, avg_daily_consumption numeric(10,2) default 0, days_of_supply numeric(8,2), risk_flag text CHECK in 'adequate'/'low'/'critical'/'stockout' default 'adequate', updated_at). Add RLS + indexes.
- M11.S2.b Build service `lib/inventory/service.ts` with: `InventoryServiceError`, `InventoryLevelDTO`, `upsertInventoryLevel()` (auto-computes: days_of_supply = current_stock / avg_daily_consumption when consumption > 0; risk_flag = stockout if current_stock <= 0, critical if <= safety_stock, low if <= reorder_point, else adequate), `listInventoryLevels()` with risk_flag filter, `getInventoryRiskSummary()` (counts by risk_flag)
- M11.S2.c Build validation `lib/validations/inventory.ts`
- M11.S2.d Build API routes: `app/api/inventory/route.ts` (GET list/POST create), `app/api/inventory/[partId]/route.ts` (GET/PUT)
- M11.S2.e Build `app/(dashboard)/inventory/page.tsx` server component — inventory dashboard showing parts with stock level progress bars (green=adequate, amber=low, red=critical, black=stockout), days-of-supply column, risk flag badges. Add `loading.tsx`, `error.tsx`, and `app/(dashboard)/inventory/_components/stock-level-bars.tsx` client component
- M11.S2.f Update `dashboard-nav.tsx` with "Inventory" link
- M11.S3.a Add to M11 migration: `integrations` (id uuid PK, organization_id FK, name text unique per org, type text CHECK in 'api_connector'/'webhook'/'data_feed'/'manual', status text CHECK in 'active'/'inactive'/'error' default 'inactive', config jsonb default '{}', last_sync_at timestamptz, error_message text, created_at). Add RLS + indexes.
- M11.S3.b Build service `lib/integrations/service.ts` with: `IntegrationServiceError`, `IntegrationDTO`, `listIntegrations()`, `createIntegration()`, `updateIntegration()`, `testConnection()` (stub: returns `{ success: true, latencyMs: 42 }` for demo)
- M11.S3.c Build validation `lib/validations/integrations.ts`
- M11.S3.d Build API routes: `app/api/integrations/route.ts` (GET/POST), `app/api/integrations/[integrationId]/route.ts` (GET/PATCH), `app/api/integrations/[integrationId]/test/route.ts` (POST connection test)
- M11.S3.e Build `app/(dashboard)/settings/integrations/page.tsx` server component — settings page showing integration cards with type icon, status badge (active=green, inactive=slate, error=rose), last sync time, test connection button. Add `loading.tsx` and `app/(dashboard)/settings/integrations/_components/integration-card.tsx` client component
- M11.S3.f Update `dashboard-nav.tsx` with "Settings" link. Pre-seed integrations: "Brave Search API" (api_connector, active), "OpenWeather" (api_connector, active), "Webhook Notifier" (webhook, inactive)

Acceptance:
- Period-based supplier performance records with auto-computed overall ratings
- Inventory levels with auto-computed risk flags and days-of-supply
- Integration registry with connection test stub
- All three features visible in dashboard with proper nav links

---

### M12 — Communication, Transportation, and Final Polish
Objective: Add communication hub (notifications), transportation risk monitoring, wire natural disaster scanning to existing weather adapter, and polish Phase 2 with seed data and documentation.

Subtasks:
- M12.S1 Communication hub (notifications)
- M12.S2 Transportation risk monitoring
- M12.S3 Natural disaster wiring and Phase 2 polish

Sub-subtasks:
- M12.S1.a Create migration `supabase/migrations/20260315140000_m12_comms_transport.sql` with table `notifications` (id uuid PK, organization_id FK, user_id FK nullable to profiles on delete cascade, title text, message text, type text CHECK in 'alert'/'incident'/'mitigation'/'compliance'/'system', reference_type text, reference_id uuid, is_read boolean default false, created_at). Add RLS + indexes on (organization_id, user_id, created_at DESC) and (organization_id, is_read).
- M12.S1.b Build service `lib/notifications/service.ts` with: `NotificationServiceError`, `NotificationDTO`, `createNotification()`, `listNotifications()` with pagination and read/unread filter, `markAsRead()` by ID, `markAllAsRead()` for user, `getUnreadCount()` for user
- M12.S1.c Build validation `lib/validations/notifications.ts`
- M12.S1.d Build API routes: `app/api/notifications/route.ts` (GET list/POST create), `app/api/notifications/read/route.ts` (POST mark read — accepts { notificationId } or { all: true }), `app/api/notifications/count/route.ts` (GET unread count)
- M12.S1.e Build client `app/(dashboard)/_components/notification-bell.tsx` — bell icon in dashboard nav showing unread count badge, click to show dropdown of recent notifications with mark-as-read action. Polls `/api/notifications/count` on mount.
- M12.S1.f Wire notification creation into existing flows: in `lib/alerts/service.ts` `generateAlertsFromScores()` — after creating/escalating an alert, call `createNotification()` with type='alert'. In `lib/incidents/service.ts` `createIncidentFromAlert()` — after creating incident, call `createNotification()` with type='incident'. Make notification creation non-blocking (catch errors, log warning, don't fail parent operation).
- M12.S2.a Add to M12 migration: `transportation_routes` (id uuid PK, organization_id FK, name text, origin_facility_id FK nullable to facilities on delete set null, destination_name text, transport_mode text CHECK in 'ocean'/'air'/'rail'/'road'/'multimodal', estimated_transit_days integer, risk_level text CHECK in 'low'/'medium'/'high'/'critical' default 'low', active_disruptions text, updated_at, created_at). Add RLS + indexes.
- M12.S2.b Build service `lib/transportation/service.ts` with: `TransportationServiceError`, `RouteDTO`, `listRoutes()` with mode/risk_level filters, `createRoute()`, `updateRoute()`, `assessRouteRisk()` (stub risk assessment: ocean=medium default, air=low, road=medium if transit>5 days else low)
- M12.S2.c Build validation `lib/validations/transportation.ts`
- M12.S2.d Build API routes: `app/api/transportation/route.ts` (GET/POST), `app/api/transportation/[routeId]/route.ts` (GET/PATCH)
- M12.S2.e Build `app/(dashboard)/transportation/page.tsx` server component — route cards showing origin facility name, destination, transport mode icon/label, estimated transit days, risk level badge, active disruptions text. Add `loading.tsx`, `error.tsx`, and create form component `app/(dashboard)/transportation/_components/route-create-form.tsx`
- M12.S2.f Update `dashboard-nav.tsx` with "Transportation" link
- M12.S3.a Build `lib/natural-disaster/monitor.ts` with `scanFacilityWeatherRisks(supabase, { organizationId })` — queries all org facilities with non-null lat/lng, calls existing `WeatherRiskAdapter` from `lib/risk-events/enrichment.ts` for each facility's country_code, creates `risk_events` with event_type='natural_disaster' for adverse weather conditions, returns summary of events created
- M12.S3.b Build API endpoint `app/api/natural-disaster/scan/route.ts` (POST — triggers facility weather scan, returns created event count)
- M12.S3.c Build `app/(dashboard)/analytics/_components/weather-risk-panel.tsx` — panel on analytics page showing recent natural disaster risk events and a "Run Weather Scan" button that calls POST /api/natural-disaster/scan
- M12.S3.d Create `supabase/seed_phase2.sql` — consolidated Phase 2 seed data for all M8–M12 tables: part_financial_profiles for 4 demo parts, 2 mitigation plans with 3 actions each, 2 compliance frameworks with 6 items, ESG scores for all 5 demo suppliers, financial health for all 5 suppliers, geopolitical profiles for 5 regions (TW/MY/DE/MX/US), 3 performance records per supplier, inventory levels for 6 parts, 3 integration records, 3 transportation routes, 5 seed notifications
- M12.S3.e Update `dashboard-nav.tsx` with final grouped navigation: **Monitor** (Overview, Supply Chain, Analytics), **Respond** (Alerts, Incidents, Mitigation), **Manage** (Suppliers, Compliance, Inventory, Transportation, Reports, Settings)
- M12.S3.f Update all docs: `doc/TASKS.md` (mark completed subtasks), `doc/PROGRESS.md` (log Phase 2 completion entries), `doc/CHANGELOG.md` (log all new tables, services, APIs, pages), `doc/DECISIONS.md` (log key Phase 2 design decisions), `doc/SCHEMA.md` (add all 13 new tables with columns/relationships/RLS)

Acceptance:
- Notifications generated on alert and incident creation, visible in nav bell
- Transportation routes trackable with risk levels and facility linkage
- Weather scan creates risk events from facility locations
- All Phase 2 seed data populates demo environment
- Dashboard nav shows complete feature set with logical grouping
- All documentation updated

---

## Phase 2 Migration Summary

| Migration File | Tables Created |
|---|---|
| `20260315100000_m8_analytics_impact.sql` | `part_financial_profiles` |
| `20260315110000_m9_mitigation_compliance.sql` | `mitigation_plans`, `mitigation_actions`, `compliance_frameworks`, `compliance_items` |
| `20260315120000_m10_extended_risk.sql` | `supplier_esg_scores`, `supplier_financial_health`, `geopolitical_risk_profiles` |
| `20260315130000_m11_operations.sql` | `supplier_performance_records`, `part_inventory_levels`, `integrations` |
| `20260315140000_m12_comms_transport.sql` | `notifications`, `transportation_routes` |

**Total: 5 new migrations, 13 new tables**

All tables follow: UUID PKs, organization_id FK with cascade, CHECK constraints for enums, RLS with `is_org_member()`, composite indexes.

## Phase 2 Subtask Prompts (Copy-Paste Ready)

### M8.S1 Prompt
`$frontend-design Implement M8.S1 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Build the supply chain network graph visualization page. The backend already exists in lib/supply-chain/mapping.ts (listSupplierNetworkOverview, getSupplierExposure). Install react-force-graph-2d package. Create app/(dashboard)/supply-chain/page.tsx as a server component that fetches network data via getDashboardContext() + supabase queries. Create client components: network-graph.tsx (force-directed graph with suppliers as nodes colored by risk score, tier links as edges) and exposure-panel.tsx (click node to see facilities/parts/risk). Add loading.tsx, error.tsx, and update dashboard-nav.tsx with "Supply Chain" link. Follow existing mac-surface styling from app/(dashboard)/suppliers/page.tsx. Run pnpm lint && pnpm typecheck && pnpm test after completion. Update doc/TASKS.md, doc/PROGRESS.md, doc/CHANGELOG.md.`

### M8.S2 Prompt
`$api-endpoint + $frontend-design Implement M8.S2 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Build historical risk analytics. Create lib/analytics/historical.ts service with getRiskEventTimeSeries() (groups risk_events by week/month + severity) and getScoreTrendHistory(). Create lib/validations/analytics.ts with HistoricalQuerySchema (startDate, endDate, granularity enum, supplierId optional). Create GET /api/analytics/risk-trends endpoint. Install recharts package. Build app/(dashboard)/analytics/page.tsx with recharts LineChart for risk trends and BarChart for severity distribution. Add disruption-timeline.tsx showing past events. Follow existing patterns from lib/alerts/service.ts and app/(dashboard)/reports/page.tsx. Update dashboard-nav.tsx with "Analytics" link. Run pnpm lint && pnpm typecheck && pnpm test. Update docs.`

### M8.S3 Prompt
`$db-migration + $api-endpoint Implement M8.S3 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Create migration supabase/migrations/20260315100000_m8_analytics_impact.sql with part_financial_profiles table (organization_id, part_id unique per org, annual_spend numeric(14,2), unit_cost, annual_volume, lead_time_days, currency). Add RLS + indexes following existing migration pattern. Build lib/impact-analysis/service.ts with calculateBusinessImpact() that sums annual_spend of supplier's linked parts and estimates disruption cost using risk score. Build validation, API endpoints (GET /api/impact-analysis/[supplierId], GET/PUT /api/parts/[partId]/financial). Extend supplier detail page with impact summary. Run pnpm lint && pnpm typecheck && pnpm test. Update docs including doc/SCHEMA.md.`

### M9.S1 Prompt
`$db-migration + $api-endpoint + $frontend-design Implement M9.S1 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Create migration supabase/migrations/20260315110000_m9_mitigation_compliance.sql with mitigation_plans table (organization_id, supplier_id nullable, alert_id nullable, title, description, strategy CHECK avoid/mitigate/transfer/accept, status CHECK draft/active/completed/archived, priority 1-5, owner_id, target_date, completed_at) and mitigation_actions table (plan_id FK, organization_id, title, status CHECK pending/in_progress/completed/cancelled, owner_id, due_date, notes). Add RLS + indexes. Build lib/mitigation/service.ts following lib/alerts/service.ts pattern with MitigationServiceError, DTOs, CRUD + completePlan (gated on all actions completed). Build lib/validations/mitigation.ts. Build API routes for plans CRUD and actions CRUD. Build dashboard pages: mitigation/page.tsx (list with status filters), mitigation/[planId]/page.tsx (detail + action checklist). Build client components: plan-create-form.tsx, plan-action-list.tsx. Run quality gates. Update docs.`

### M9.S2 Prompt
`$api-endpoint + $frontend-design Implement M9.S2 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Add compliance_frameworks and compliance_items tables to the existing M9 migration file (supabase/migrations/20260315110000_m9_mitigation_compliance.sql). compliance_frameworks: organization_id, name unique per org, description, category CHECK regulatory/industry/internal/esg. compliance_items: framework_id FK, organization_id, supplier_id nullable, requirement text, status CHECK not_assessed/compliant/non_compliant/partially_compliant/exempted, evidence_notes, assessed_at, next_review_date. Add RLS + indexes. Build lib/compliance/service.ts with CRUD + getComplianceSummary (percentage per framework). Build validation, API routes (frameworks CRUD, items CRUD, item status update). Build dashboard pages: compliance/page.tsx (framework cards with progress bars), compliance/[frameworkId]/page.tsx (items per supplier). Build client components: compliance-status-badge.tsx, item-assessment-form.tsx. Update dashboard-nav.tsx with Mitigation + Compliance links. Run quality gates. Update docs.`

### M10.S1 Prompt
`$db-migration + $api-endpoint + $frontend-design Implement M10.S1 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Create migration supabase/migrations/20260315120000_m10_extended_risk.sql with supplier_esg_scores table (organization_id, supplier_id unique, environmental_score 0-100, social_score 0-100, governance_score 0-100, composite_score 0-100, assessment_date, notes). Add RLS + indexes. Build lib/esg/service.ts with upsertEsgScore (auto-compute composite = E*0.4 + S*0.35 + G*0.25), getEsgScore, listEsgScores. Build validation lib/validations/esg.ts. Build API routes: GET/POST /api/esg-scores, GET/PUT /api/esg-scores/[supplierId]. Extend app/(dashboard)/suppliers/[supplierId]/page.tsx with ESG section showing E/S/G breakdown bars and composite. Build esg-score-card.tsx client component. Run quality gates. Update docs.`

### M10.S2 Prompt
`$api-endpoint + $frontend-design Implement M10.S2 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Add supplier_financial_health table to existing M10 migration (supabase/migrations/20260315120000_m10_extended_risk.sql): organization_id, supplier_id unique, credit_rating CHECK AAA-D/NR, altman_z_score, revenue_trend CHECK growing/stable/declining/unknown, debt_to_equity, days_payable_outstanding, financial_risk_level CHECK low/medium/high/critical, assessed_at, notes. Add RLS + indexes. Build lib/financial-risk/service.ts with upsertFinancialHealth (auto-compute risk_level from Altman Z: <1.8=critical, <2.7=high, <3.0=medium, >=3.0=low). Build validation, API routes: GET/POST /api/financial-risk, GET/PUT /api/financial-risk/[supplierId]. Extend supplier detail with financial-health-card.tsx (credit rating badge, Z-score, trend arrow, risk indicator). Run quality gates. Update docs.`

### M10.S3 Prompt
`$api-endpoint + $frontend-design Implement M10.S3 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Add geopolitical_risk_profiles table to existing M10 migration: organization_id, region_code unique per org, risk_level CHECK low/medium/high/critical, stability_index 0-100, sanctions_active boolean, trade_restriction_notes, updated_at. Add RLS + indexes. Build lib/geopolitical/service.ts with upsertGeoRiskProfile, listGeoRiskProfiles, getGeoRiskByRegion, getSupplierGeoRisk (joins supplier region_code). Build validation, API routes: GET/POST /api/geopolitical-risk, GET/PUT /api/geopolitical-risk/[regionCode]. Add geo-risk-map.tsx to analytics page showing region risk table with risk_level badges, stability bars, sanctions flags, affected supplier counts. Seed profiles for TW(high), MY(medium), DE(low), MX(medium), US(low). Run quality gates. Update docs.`

### M11.S1 Prompt
`$db-migration + $api-endpoint + $frontend-design Implement M11.S1 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Create migration supabase/migrations/20260315130000_m11_operations.sql with supplier_performance_records table (organization_id, supplier_id, period_start date, period_end date, on_time_delivery_rate 0-100, quality_rejection_rate 0-100, lead_time_variance_days integer, responsiveness_score 1-5, overall_rating, notes). Add RLS + indexes. Build lib/performance/service.ts with addPerformanceRecord (auto-compute overall_rating = delivery*0.4 + (100-quality)*0.3 + max(0,100-abs(variance)*5)*0.15 + responsiveness*20*0.15), listPerformanceHistory per supplier, getPerformanceSummary. Build validation, API routes: GET/POST /api/performance, GET /api/performance/[supplierId]. Extend supplier detail with performance section + sparkline chart using recharts. Run quality gates. Update docs.`

### M11.S2 Prompt
`$api-endpoint + $frontend-design Implement M11.S2 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Add part_inventory_levels table to existing M11 migration: organization_id, part_id unique per org+part, current_stock integer, safety_stock integer, reorder_point integer, max_stock integer, avg_daily_consumption, days_of_supply, risk_flag CHECK adequate/low/critical/stockout. Add RLS + indexes. Build lib/inventory/service.ts with upsertInventoryLevel (auto-compute days_of_supply and risk_flag: <=0=stockout, <=safety=critical, <=reorder=low, else adequate), listInventoryLevels with risk_flag filter, getInventoryRiskSummary. Build validation, API routes: GET/POST /api/inventory, GET/PUT /api/inventory/[partId]. Build app/(dashboard)/inventory/page.tsx with stock level progress bars (green/amber/red/black) and risk badges. Add stock-level-bars.tsx client component. Update dashboard-nav.tsx with "Inventory" link. Run quality gates. Update docs.`

### M11.S3 Prompt
`$api-endpoint + $frontend-design Implement M11.S3 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Add integrations table to existing M11 migration: organization_id, name unique per org, type CHECK api_connector/webhook/data_feed/manual, status CHECK active/inactive/error, config jsonb, last_sync_at, error_message. Add RLS + indexes. Build lib/integrations/service.ts with listIntegrations, createIntegration, updateIntegration, testConnection (stub returning {success:true, latencyMs:42}). Build validation, API routes: GET/POST /api/integrations, GET/PATCH /api/integrations/[integrationId], POST /api/integrations/[integrationId]/test. Build app/(dashboard)/settings/integrations/page.tsx with integration status cards. Build integration-card.tsx client component with test connection button. Update dashboard-nav.tsx with "Settings" link. Pre-seed: "Brave Search API" (active), "OpenWeather" (active), "Webhook Notifier" (inactive). Run quality gates. Update docs.`

### M12.S1 Prompt
`$api-endpoint + $frontend-design Implement M12.S1 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Create migration supabase/migrations/20260315140000_m12_comms_transport.sql with notifications table (organization_id, user_id FK nullable, title, message, type CHECK alert/incident/mitigation/compliance/system, reference_type text, reference_id uuid, is_read boolean, created_at). Add RLS + indexes on (org_id, user_id, created_at DESC) and (org_id, is_read). Build lib/notifications/service.ts with createNotification, listNotifications (pagination + read filter), markAsRead, markAllAsRead, getUnreadCount. Build validation, API routes: GET/POST /api/notifications, POST /api/notifications/read, GET /api/notifications/count. Build client notification-bell.tsx in dashboard nav — bell icon with unread badge, click dropdown showing recent notifications with mark-read action. Wire createNotification into lib/alerts/service.ts (after alert generation) and lib/incidents/service.ts (after incident creation) as non-blocking calls. Run quality gates. Update docs.`

### M12.S2 Prompt
`$api-endpoint + $frontend-design Implement M12.S2 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Add transportation_routes table to existing M12 migration: organization_id, name, origin_facility_id FK nullable, destination_name, transport_mode CHECK ocean/air/rail/road/multimodal, estimated_transit_days, risk_level CHECK low/medium/high/critical, active_disruptions text, updated_at. Add RLS + indexes. Build lib/transportation/service.ts with listRoutes (mode/risk filters), createRoute, updateRoute, assessRouteRisk (stub: ocean=medium, air=low, road=medium if transit>5d). Build validation, API routes: GET/POST /api/transportation, GET/PATCH /api/transportation/[routeId]. Build app/(dashboard)/transportation/page.tsx with route cards showing mode, transit days, risk badge, disruptions. Build route-create-form.tsx client component. Update dashboard-nav.tsx with "Transportation" link. Seed 3-4 routes connecting demo facilities. Run quality gates. Update docs.`

### M12.S3 Prompt
`$risk-intelligence-ingestion + $frontend-design Implement M12.S3 from doc/blueprint/E2E_DEVELOPMENT_PLAN.md (Phase 2 section). Build lib/natural-disaster/monitor.ts with scanFacilityWeatherRisks() — queries org facilities with lat/lng, calls existing WeatherRiskAdapter from lib/risk-events/enrichment.ts, creates risk_events with event_type='natural_disaster'. Build POST /api/natural-disaster/scan endpoint. Build weather-risk-panel.tsx on analytics page with "Run Weather Scan" button and recent natural disaster events list. Create supabase/seed_phase2.sql with consolidated Phase 2 seed data for ALL M8-M12 tables. Update dashboard-nav.tsx with final grouped nav (Monitor/Respond/Manage). Update ALL docs: TASKS.md, PROGRESS.md, CHANGELOG.md, DECISIONS.md, SCHEMA.md with complete Phase 2 records. Run scripts/preflight.sh and pnpm lint && pnpm typecheck && pnpm test.`
