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
