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
- [ ] M2.S1 Migration hardening and seed strategy
- [ ] M2.S1.a Validate migration and patch gaps
- [ ] M2.S1.b Seed script strategy
- [ ] M2.S1.c SCHEMA doc updates
- [ ] M2.S2 CRUD APIs for suppliers/facilities/parts
- [ ] M2.S2.a CRUD handlers
- [ ] M2.S2.b Zod validation
- [ ] M2.S2.c Org authorization checks
- [ ] M2.S3 Supply chain mapping service
- [ ] M2.S3.a Tier links logic
- [ ] M2.S3.b Exposure helpers
- [ ] M2.S3.c UI DTO output

### M3 Risk Ingestion + MCP Enrichment
- [ ] M3.S1 Risk event ingestion pipeline
- [ ] M3.S1.a Ingestion contract
- [ ] M3.S1.b Event normalization
- [ ] M3.S1.c Supplier/facility impact mapping
- [ ] M3.S2 MCP enrichment adapters
- [ ] M3.S2.a Web search adapter
- [ ] M3.S2.b Weather adapter
- [ ] M3.S2.c Payload schema + confidence rubric
- [ ] M3.S3 Deduplication and provenance tracking
- [ ] M3.S3.a Dedupe keys
- [ ] M3.S3.b Source provenance persistence
- [ ] M3.S3.c Low-confidence fallback

### M4 Risk Scoring, Alerts, and Incident Workflows
- [ ] M4.S1 Risk scoring engine
- [ ] M4.S1.a Weighted formula
- [ ] M4.S1.b Trend logic
- [ ] M4.S1.c Explanation payload
- [ ] M4.S2 Alert generation and acknowledgment
- [ ] M4.S2.a Threshold rules
- [ ] M4.S2.b Acknowledge/resolve endpoints
- [ ] M4.S2.c Owner/timeline fields
- [ ] M4.S3 Incident and action management
- [ ] M4.S3.a Incident from alert
- [ ] M4.S3.b Playbook generation
- [ ] M4.S3.c Action transitions and closure

### M5 Dashboard and Workflow UI
- [ ] M5.S1 Overview dashboard
- [ ] M5.S1.a KPI cards
- [ ] M5.S1.b Disruption feed + filters
- [ ] M5.S1.c Skeleton/loading/error states
- [ ] M5.S2 Supplier and alert detail screens
- [ ] M5.S2.a Supplier risk list/detail
- [ ] M5.S2.b Alert detail evidence view
- [ ] M5.S2.c Acknowledgment actions
- [ ] M5.S3 Incident board and report views
- [ ] M5.S3.a Incident board
- [ ] M5.S3.b Action checklist editor
- [ ] M5.S3.c Report summary page

### M6 Testing and Quality Gates
- [ ] M6.S1 Unit tests for validation/business logic
- [ ] M6.S1.a Validation/scoring tests
- [ ] M6.S1.b API handler tests
- [ ] M6.S1.c Incident transition tests
- [ ] M6.S2 E2E tests for critical journeys
- [ ] M6.S2.a Auth journey
- [ ] M6.S2.b Ingestion -> alert journey
- [ ] M6.S2.c Alert -> incident closure journey
- [ ] M6.S3 Preflight + CI checklist
- [ ] M6.S3.a Run preflight
- [ ] M6.S3.b Run lint/typecheck/test/e2e
- [ ] M6.S3.c Log residual risks

### M7 Deployment, Demo, and Submission Pack
- [ ] M7.S1 Vercel deployment setup
- [ ] M7.S1.a Env and runtime config
- [ ] M7.S1.b Production health checks
- [ ] M7.S1.c Post-deploy smoke test
- [ ] M7.S2 Demo data and script stabilization
- [ ] M7.S2.a Seed validation
- [ ] M7.S2.b First-login populated dashboard validation
- [ ] M7.S2.c Stable demo account/script
- [ ] M7.S3 Submission package preparation
- [ ] M7.S3.a 5-minute demo script
- [ ] M7.S3.b Link bundle prep
- [ ] M7.S3.c Final judging checklist pass
