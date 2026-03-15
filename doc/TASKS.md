# TASKS

## Completed Foundation
- [x] (2026-03-14 10:54) Create mandatory `/doc` stubs per AGENTS.md.
- [x] (2026-03-14 10:55) Analyze `resilinc_blueprint.pdf`, `AGENTS.md`, and `Mahakurukshetra.md`.
- [x] (2026-03-14 10:56) Produce architecture and MCP integration blueprint docs.
- [x] (2026-03-14 10:56) Create reusable agent skill scaffolds in `.agents/skills/`.
- [x] (2026-03-14 10:56) Add Supabase MVP migration schema with RLS policies.
- [x] (2026-03-14 10:56) Scaffold baseline project directories and foundation files.
- [x] (2026-03-14 10:58) Add minimal Next.js/Tailwind/TypeScript config for runnable setup.
- [x] (2026-03-14 11:14) Cleanup structure: merged `docs/` into `doc/blueprint/` and removed redundant `agents/`.
- [x] (2026-03-14 11:20) Add implementation control loop (`IMPLEMENTATION_STATE`, `SKILL_ROUTER`, `PROMPT_APPENDIX`, `scripts/preflight.sh`).
- [x] (2026-03-14 11:42) Add comprehensive blueprint-driven E2E execution plan, subtask prompts, and upgraded `suffix_prompt.md`.
- [x] (2026-03-14 14:02) Configure `pnpm` and execute previously skipped M1 quality gates (`lint`, `typecheck`, `test`) with fixes.
- [x] (2026-03-14 14:47) Hotfix M1 auth: handle Supabase email rate-limits and implement working reset-password recovery callback/update flow.
- [x] (2026-03-14 14:53) Improve reset-email cooldown reliability with dynamic wait parsing + persisted cooldown buffer to avoid repeated provider throttling.
- [x] (2026-03-14 16:36) Apply remote Supabase MVP migration to hosted project via Management API and verify required tables/RLS now exist.
- [x] (2026-03-14 16:40) Hotfix M1 dashboard access: auto-bootstrap personal organization + owner membership for authenticated users without existing org membership.
- [x] (2026-03-14 16:46) Add temporary `AUTH_BYPASS_ENABLED` switch to disable auth guards in middleware/dashboard and enable direct app access for local development.
- [x] (2026-03-14 17:13) Force demo actor context for bypass mode: all API org access resolves as `Akash Bhavsar` when `AUTH_BYPASS_ENABLED=true`.
- [x] (2026-03-14 17:18) Replace overview placeholder with live data dashboard cards/lists (suppliers, facilities, parts, alerts/incidents) for bypass-mode demo usability.
- [x] (2026-03-14 17:29) Configure local `SUPABASE_SERVICE_ROLE_KEY`, create demo auth user, apply remote M2 hardening migration, and seed remote demo data for populated overview.
- [x] (2026-03-14 18:52) Redesign dashboard with Mac-style UI system, add backend-wired Risk Events workspace, and add supplier creation UX in frontend.
- [x] (2026-03-14 18:57) Turn off auth bypass mode and replace `/` redirect with a public landing page that routes users to login/signup or dashboard.
- [x] (2026-03-14 19:03) Add meaningful alert operations interactivity (live filters/search, generate alerts from scores, create incident from alert) to avoid static-only dashboard usage.
- [x] (2026-03-14 19:07) Fix signup confirmation reliability: add `emailRedirectTo` on signup and add resend-confirmation API/UI flow for local/hosted environments.
- [x] (2026-03-14 19:12) Fix signup hydration error by removing nested forms and add localhost-only auto-confirm fallback option for dev when confirmation mail is unavailable.
- [x] (2026-03-14 19:17) Fix signup workspace bootstrap RLS failure by adding authenticated-user fallback provisioning with service-role recovery in dashboard layout.

## E2E Blueprint Execution Plan (Track by ID)
Reference: `doc/blueprint/E2E_DEVELOPMENT_PLAN.md`

### M1 Platform & Auth Foundation
- [x] (2026-03-14 13:31) M1.S1 Supabase SSR client implementation
- [x] (2026-03-14 13:31) M1.S1.a Browser client utility
- [x] (2026-03-14 13:31) M1.S1.b Server client utility
- [x] (2026-03-14 13:31) M1.S1.c Middleware session refresh wiring
- [x] (2026-03-14 13:41) M1.S2 Auth flows (login/signup/logout/reset)
- [x] (2026-03-14 13:41) M1.S2.a Auth pages with Zod forms
- [x] (2026-03-14 13:41) M1.S2.b Auth handlers/server actions
- [x] (2026-03-14 13:41) M1.S2.c Redirect logic
- [x] (2026-03-14 13:48) M1.S3 Protected dashboard session guard
- [x] (2026-03-14 13:48) M1.S3.a Dashboard layout guard
- [x] (2026-03-14 13:48) M1.S3.b Profile bootstrap
- [x] (2026-03-14 13:48) M1.S3.c Unauthorized/error states

### M2 Core Data and Supply Chain Mapping
- [x] (2026-03-14 17:08) M2.S1 Migration hardening and seed strategy
- [x] (2026-03-14 17:08) M2.S1.a Validate migration and patch gaps
- [x] (2026-03-14 17:08) M2.S1.b Seed script strategy
- [x] (2026-03-14 17:08) M2.S1.c SCHEMA doc updates
- [x] (2026-03-14 17:08) M2.S2 CRUD APIs for suppliers/facilities/parts
- [x] (2026-03-14 17:08) M2.S2.a CRUD handlers
- [x] (2026-03-14 17:08) M2.S2.b Zod validation
- [x] (2026-03-14 17:08) M2.S2.c Org authorization checks
- [x] (2026-03-14 17:08) M2.S3 Supply chain mapping service
- [x] (2026-03-14 17:08) M2.S3.a Tier links logic
- [x] (2026-03-14 17:08) M2.S3.b Exposure helpers
- [x] (2026-03-14 17:08) M2.S3.c UI DTO output

### M3 Risk Ingestion + MCP Enrichment
- [x] (2026-03-14 17:46) M3.S1 Risk event ingestion pipeline
- [x] (2026-03-14 17:46) M3.S1.a Ingestion contract
- [x] (2026-03-14 17:46) M3.S1.b Event normalization
- [x] (2026-03-14 17:46) M3.S1.c Supplier/facility impact mapping
- [x] (2026-03-14 17:56) M3.S2 MCP enrichment adapters
- [x] (2026-03-14 17:56) M3.S2.a Web search adapter
- [x] (2026-03-14 17:56) M3.S2.b Weather adapter
- [x] (2026-03-14 17:56) M3.S2.c Payload schema + confidence rubric
- [x] (2026-03-14 17:56) M3.S3 Deduplication and provenance tracking
- [x] (2026-03-14 17:56) M3.S3.a Dedupe keys
- [x] (2026-03-14 17:56) M3.S3.b Source provenance persistence
- [x] (2026-03-14 17:56) M3.S3.c Low-confidence fallback

### M4 Risk Scoring, Alerts, and Incident Workflows
- [x] (2026-03-14 18:13) M4.S1 Risk scoring engine
- [x] (2026-03-14 18:13) M4.S1.a Weighted formula
- [x] (2026-03-14 18:13) M4.S1.b Trend logic
- [x] (2026-03-14 18:13) M4.S1.c Explanation payload
- [x] (2026-03-14 18:13) M4.S2 Alert generation and acknowledgment
- [x] (2026-03-14 18:13) M4.S2.a Threshold rules
- [x] (2026-03-14 18:13) M4.S2.b Acknowledge/resolve endpoints
- [x] (2026-03-14 18:13) M4.S2.c Owner/timeline fields
- [x] (2026-03-14 18:13) M4.S3 Incident and action management
- [x] (2026-03-14 18:13) M4.S3.a Incident from alert
- [x] (2026-03-14 18:13) M4.S3.b Playbook generation
- [x] (2026-03-14 18:13) M4.S3.c Action transitions and closure

### M5 Dashboard and Workflow UI
- [x] (2026-03-14 18:47) M5.S1 Overview dashboard
- [x] (2026-03-14 18:47) M5.S1.a KPI cards
- [x] (2026-03-14 18:47) M5.S1.b Disruption feed + filters
- [x] (2026-03-14 18:47) M5.S1.c Skeleton/loading/error states
- [x] (2026-03-14 18:22) M5.S2 Supplier and alert detail screens
- [x] (2026-03-14 18:22) M5.S2.a Supplier risk list/detail
- [x] (2026-03-14 18:22) M5.S2.b Alert detail evidence view
- [x] (2026-03-14 18:22) M5.S2.c Acknowledgment actions
- [x] (2026-03-14 18:22) M5.S3 Incident board and report views
- [x] (2026-03-14 18:22) M5.S3.a Incident board
- [x] (2026-03-14 18:22) M5.S3.b Action checklist editor
- [x] (2026-03-14 18:22) M5.S3.c Report summary page

### M6 Testing and Quality Gates
- [~] (2026-03-14 18:47) M6.S1 Unit tests for validation/business logic
- [x] (2026-03-14 18:47) M6.S1.a Validation/scoring tests
- [ ] M6.S1.b API handler tests
- [x] (2026-03-14 18:47) M6.S1.c Incident transition tests
- [~] (2026-03-14 18:47) M6.S2 E2E tests for critical journeys (specs added; execution deferred per user request)
- [ ] M6.S2.a Auth journey
- [~] (2026-03-14 18:47) M6.S2.b Ingestion -> alert journey
- [~] (2026-03-14 18:47) M6.S2.c Alert -> incident closure journey
- [~] (2026-03-14 18:47) M6.S3 Preflight + CI checklist
- [x] (2026-03-14 18:47) M6.S3.a Run preflight
- [~] (2026-03-14 18:47) M6.S3.b Run lint/typecheck/test/e2e (non-E2E gates passed; Playwright execution deferred)
- [x] (2026-03-14 18:47) M6.S3.c Log residual risks

### M7 Deployment, Demo, and Submission Pack
- [~] (2026-03-14 15:42) M7.S1 Vercel deployment setup (production live, GitHub auto-deploy blocked on missing Vercel GitHub login connection)
- [x] (2026-03-14 15:17) M7.S1.a Env and runtime config
- [x] (2026-03-14 15:42) M7.S1.b Production health checks
- [x] (2026-03-14 15:42) M7.S1.c Post-deploy smoke test
- [ ] M7.S2 Demo data and script stabilization
- [ ] M7.S2.a Seed validation
- [ ] M7.S2.b First-login populated dashboard validation
- [ ] M7.S2.c Stable demo account/script
- [ ] M7.S3 Submission package preparation
- [ ] M7.S3.a 5-minute demo script
- [ ] M7.S3.b Link bundle prep
- [ ] M7.S3.c Final judging checklist pass

---

## Phase 2 — Blueprint Feature Completion (M8–M12)
Reference: `doc/blueprint/E2E_DEVELOPMENT_PLAN.md` (Phase 2 section)

### M8 Visual Intelligence and Historical Analysis
- [x] (2026-03-15 13:52) M8.S1 Supply chain network graph UI
- [x] (2026-03-15 13:52) M8.S1.a Server page fetching network overview data from existing `lib/supply-chain/mapping.ts`
- [x] (2026-03-15 13:52) M8.S1.b Client `network-graph.tsx` component (react-force-graph-2d, nodes=suppliers, edges=tier links)
- [x] (2026-03-15 13:52) M8.S1.c Client `exposure-panel.tsx` click-to-expand supplier exposure details
- [x] (2026-03-15 13:52) M8.S1.d Loading/error states and dashboard nav update
- [x] (2026-03-15 13:52) M8.S2 Historical risk analytics
- [x] (2026-03-15 13:52) M8.S2.a Service `lib/analytics/historical.ts` with `getRiskEventTimeSeries()`, `getScoreTrendHistory()`
- [x] (2026-03-15 13:52) M8.S2.b Zod validation `lib/validations/analytics.ts` (date range, granularity, supplierId)
- [x] (2026-03-15 13:52) M8.S2.c API endpoint `GET /api/analytics/risk-trends`
- [x] (2026-03-15 13:52) M8.S2.d Analytics dashboard page with `risk-trend-chart.tsx` and `disruption-timeline.tsx` (recharts)
- [x] (2026-03-15 13:52) M8.S2.e Dashboard nav update for Analytics link
- [x] (2026-03-15 13:52) M8.S3 Business impact analysis
- [x] (2026-03-15 13:52) M8.S3.a Migration `20260315100000_m8_analytics_impact.sql` adding `part_financial_profiles` table
- [x] (2026-03-15 13:52) M8.S3.b Service `lib/impact-analysis/service.ts` with `calculateBusinessImpact()`
- [x] (2026-03-15 13:52) M8.S3.c Validation `lib/validations/impact-analysis.ts`
- [x] (2026-03-15 13:52) M8.S3.d API endpoints: `GET /api/impact-analysis/[supplierId]`, `GET/PUT /api/parts/[partId]/financial`
- [x] (2026-03-15 13:52) M8.S3.e Extend supplier detail page with business impact summary section

### M9 Risk Mitigation and Compliance
- [ ] M9.S1 Risk mitigation planning
- [ ] M9.S1.a Migration `20260315110000_m9_mitigation_compliance.sql` adding `mitigation_plans` + `mitigation_actions` tables
- [ ] M9.S1.b Service `lib/mitigation/service.ts` (CRUD + status workflow: draft→active→completed→archived)
- [ ] M9.S1.c Validation `lib/validations/mitigation.ts`
- [ ] M9.S1.d API routes: `GET/POST /api/mitigation-plans`, `GET/PATCH /api/mitigation-plans/[planId]`
- [ ] M9.S1.e API routes: `GET/POST /api/mitigation-plans/[planId]/actions`, `PATCH .../actions/[actionId]/status`
- [ ] M9.S1.f Dashboard pages: `mitigation/page.tsx` (list), `mitigation/[planId]/page.tsx` (detail)
- [ ] M9.S1.g Client components: `plan-create-form.tsx`, `plan-action-list.tsx`
- [ ] M9.S2 Compliance and regulatory tracking
- [ ] M9.S2.a Add `compliance_frameworks` + `compliance_items` tables to M9 migration
- [ ] M9.S2.b Service `lib/compliance/service.ts` (CRUD + compliance percentage summaries)
- [ ] M9.S2.c Validation `lib/validations/compliance.ts`
- [ ] M9.S2.d API routes: `GET/POST /api/compliance/frameworks`, `GET/POST .../[frameworkId]/items`, `PATCH .../items/[itemId]`
- [ ] M9.S2.e Dashboard pages: `compliance/page.tsx` (framework cards + progress bars), `compliance/[frameworkId]/page.tsx`
- [ ] M9.S2.f Client components: `compliance-status-badge.tsx`, `item-assessment-form.tsx`
- [ ] M9.S2.g Dashboard nav update for Mitigation + Compliance links

### M10 Extended Risk Dimensions
- [ ] M10.S1 ESG risk evaluation
- [ ] M10.S1.a Migration `20260315120000_m10_extended_risk.sql` adding `supplier_esg_scores` table
- [ ] M10.S1.b Service `lib/esg/service.ts` (CRUD + composite score: E:40%, S:35%, G:25%)
- [ ] M10.S1.c Validation `lib/validations/esg.ts`
- [ ] M10.S1.d API routes: `GET/POST /api/esg-scores`, `GET/PUT /api/esg-scores/[supplierId]`
- [ ] M10.S1.e Extend supplier detail page with ESG score card component
- [ ] M10.S2 Financial risk assessment
- [ ] M10.S2.a Add `supplier_financial_health` table to M10 migration
- [ ] M10.S2.b Service `lib/financial-risk/service.ts` (CRUD + Altman Z-score risk level computation)
- [ ] M10.S2.c Validation `lib/validations/financial-risk.ts`
- [ ] M10.S2.d API routes: `GET/POST /api/financial-risk`, `GET/PUT /api/financial-risk/[supplierId]`
- [ ] M10.S2.e Extend supplier detail page with financial health card component
- [ ] M10.S3 Geopolitical risk enhancement
- [ ] M10.S3.a Add `geopolitical_risk_profiles` table to M10 migration
- [ ] M10.S3.b Service `lib/geopolitical/service.ts` (CRUD + supplier-region linkage)
- [ ] M10.S3.c Validation `lib/validations/geopolitical.ts`
- [ ] M10.S3.d API routes: `GET/POST /api/geopolitical-risk`, `GET/PUT /api/geopolitical-risk/[regionCode]`
- [ ] M10.S3.e Add `geo-risk-map.tsx` region risk summary to analytics page

### M11 Operational Features
- [ ] M11.S1 Supplier performance tracking
- [ ] M11.S1.a Migration `20260315130000_m11_operations.sql` adding `supplier_performance_records` table
- [ ] M11.S1.b Service `lib/performance/service.ts` (CRUD + overall rating: delivery 40%, quality 30%, lead time 15%, responsiveness 15%)
- [ ] M11.S1.c Validation `lib/validations/performance.ts`
- [ ] M11.S1.d API routes: `GET/POST /api/performance`, `GET /api/performance/[supplierId]`
- [ ] M11.S1.e Extend supplier detail page with performance chart section
- [ ] M11.S2 Inventory risk assessment
- [ ] M11.S2.a Add `part_inventory_levels` table to M11 migration
- [ ] M11.S2.b Service `lib/inventory/service.ts` (CRUD + risk flag: stockout/critical/low/adequate, days-of-supply)
- [ ] M11.S2.c Validation `lib/validations/inventory.ts`
- [ ] M11.S2.d API routes: `GET/POST /api/inventory`, `GET/PUT /api/inventory/[partId]`
- [ ] M11.S2.e Dashboard page: `inventory/page.tsx` with color-coded stock level bars
- [ ] M11.S2.f Dashboard nav update for Inventory link
- [ ] M11.S3 Integration management
- [ ] M11.S3.a Add `integrations` table to M11 migration
- [ ] M11.S3.b Service `lib/integrations/service.ts` (CRUD + connection test stub)
- [ ] M11.S3.c Validation `lib/validations/integrations.ts`
- [ ] M11.S3.d API routes: `GET/POST /api/integrations`, `GET/PATCH /api/integrations/[integrationId]`, `POST .../test`
- [ ] M11.S3.e Dashboard page: `settings/integrations/page.tsx` with integration status cards
- [ ] M11.S3.f Dashboard nav update for Settings link

### M12 Communication, Transportation, and Final Polish
- [ ] M12.S1 Communication hub (notifications)
- [ ] M12.S1.a Migration `20260315140000_m12_comms_transport.sql` adding `notifications` table
- [ ] M12.S1.b Service `lib/notifications/service.ts` (create, list, markRead, unreadCount)
- [ ] M12.S1.c Validation `lib/validations/notifications.ts`
- [ ] M12.S1.d API routes: `GET/POST /api/notifications`, `POST /api/notifications/read`, `GET /api/notifications/count`
- [ ] M12.S1.e Client `notification-bell.tsx` in dashboard nav with unread badge + dropdown
- [ ] M12.S1.f Wire notification creation into existing alert/incident service flows
- [ ] M12.S2 Transportation risk monitoring
- [ ] M12.S2.a Add `transportation_routes` table to M12 migration
- [ ] M12.S2.b Service `lib/transportation/service.ts` (CRUD + route risk assessment)
- [ ] M12.S2.c Validation `lib/validations/transportation.ts`
- [ ] M12.S2.d API routes: `GET/POST /api/transportation`, `GET/PATCH /api/transportation/[routeId]`
- [ ] M12.S2.e Dashboard page: `transportation/page.tsx` with route risk cards
- [ ] M12.S2.f Dashboard nav update for Transportation link
- [ ] M12.S3 Natural disaster wiring and Phase 2 polish
- [ ] M12.S3.a `lib/natural-disaster/monitor.ts` — scan facilities using existing WeatherRiskAdapter
- [ ] M12.S3.b API endpoint: `POST /api/natural-disaster/scan`
- [ ] M12.S3.c `weather-risk-panel.tsx` on analytics page showing facility weather alerts
- [ ] M12.S3.d Phase 2 consolidated seed data (`supabase/seed_phase2.sql`) for all M8–M12 tables
- [ ] M12.S3.e Update dashboard nav with grouped categories (Monitor/Respond/Manage)
- [ ] M12.S3.f Update all docs: TASKS, PROGRESS, CHANGELOG, DECISIONS, SCHEMA
