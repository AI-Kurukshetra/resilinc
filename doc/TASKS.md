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
