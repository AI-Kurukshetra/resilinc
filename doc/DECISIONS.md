# DECISIONS

## 2026-03-14 — Keep MVP narrow and demo-first
Rationale: Hackathon judging and time constraints favor a reliable end-to-end workflow over breadth.

## 2026-03-14 — Multi-tenant org-scoped schema with strict RLS
Rationale: Required for security baseline and future enterprise expansion.

## 2026-03-14 — Skill-driven agent architecture in-repo
Rationale: Reusable skills reduce future setup overhead and enforce consistent workflows.

## 2026-03-14 — MCP enrichment as modular pipeline
Rationale: Enables incremental data-source expansion without core schema rewrites.

## 2026-03-14 — Include runnable local scaffold config in foundation
Rationale: Reduces setup friction during hackathon by letting future agents start implementation immediately.

## 2026-03-14 — Use one docs root: `doc/` with `doc/blueprint/`
Rationale: Eliminates ambiguity between `doc/` and `docs/` while preserving required AGENTS.md tracking files.

## 2026-03-14 — Add a mandatory preflight control loop
Rationale: Ensures every new agent reads the same source-of-truth files, picks the correct skill path, and avoids redundant structures before handoff.

## 2026-03-14 — Track delivery by hierarchical task IDs tied to prompts
Rationale: `Mx.Sy(.z)` IDs remove ambiguity, enable deterministic handoffs, and allow one-subtask-at-a-time execution across agents.

## 2026-03-14 — Centralize Supabase SSR session validation in middleware and server helpers
Rationale: Always calling `supabase.auth.getUser()` in middleware avoids trusting stale cookies, while `getAuthenticatedOrgSession()` ensures authenticated requests can be resolved to an org membership before org-scoped operations.

## 2026-03-14 — Standardize auth API contracts with explicit JSON error codes
Rationale: Returning structured `{ ok, data | error }` responses with validation field errors makes login/signup/reset/logout flows deterministic and directly testable in unit/integration tests.

## 2026-03-14 — Enforce route access with middleware-level redirect rules
Rationale: Centralized redirects (`/` resolution, auth-page bounce for signed-in users, and protected-route guard for signed-out users) reduce duplicated page-level checks and prevent inconsistent auth behavior across routes.

## 2026-03-14 — Bootstrap user profile in dashboard guard before org membership checks
Rationale: `organization_members.user_id` references `profiles.user_id`, so creating the authenticated user's profile at first dashboard access avoids downstream foreign-key and membership-flow failures.

## 2026-03-14 — Keep `/logout` outside guarded dashboard route group
Rationale: Users who are authenticated but lack organization membership must still be able to terminate their session; placing logout in the auth group prevents lock-in behind membership checks.

## 2026-03-14 — Use ESLint FlatCompat bridge for Next core-web-vitals rules
Rationale: Next 15 lint execution in this workspace uses ESLint flat config; `FlatCompat` cleanly reuses `next/core-web-vitals` without downgrading lint coverage.

## 2026-03-14 — Add minimal M1 regression tests before moving to M2
Rationale: The earlier environment gap skipped quality gates; adding unit coverage for auth validation and redirect sanitization ensures M1 behavior is now verifiable and repeatable.

## 2026-03-14 — Route password recovery through `/auth/callback` before `/update-password`
Rationale: Supabase recovery links require token/code exchange to establish session state; centralizing the exchange route makes reset links deterministic and prevents broken login redirects.

## 2026-03-14 — Treat Supabase email throttling as explicit `AUTH_RATE_LIMITED`
Rationale: Mapping provider-specific rate-limit responses to a stable API contract enables predictable UI behavior (cooldown timer) and clearer feedback to users during repeated reset/signup requests.

## 2026-03-14 — Add cooldown persistence + safety buffer for reset-email retries
Rationale: Provider-side throttling windows can outlast client-side second counters; persisting cooldown and adding a small retry buffer reduces repeated 429 loops and stabilizes UX after refreshes.

## 2026-03-14 — Add a lightweight `/api/health` endpoint for deployment verification
Rationale: Vercel smoke checks need a deterministic readiness signal; env-presence checks and status-based responses provide a fast post-deploy validation target.

## 2026-03-14 — Standardize auth page `searchParams` as Promise-based props
Rationale: Next.js 15 route type generation expects `PageProps["searchParams"]` as `Promise<any> | undefined`; using object unions caused production build worker failures.

## 2026-03-14 — Treat GitHub Login Connection as a hard prerequisite for Vercel push auto-deploy
Rationale: Even with project link and live production deployment complete, `vercel git connect` fails until the Vercel account has an attached GitHub login connection with repo access.

## 2026-03-14 — Use Supabase Management API `database/query` as fallback migration path
Rationale: When direct DB sockets are blocked by network constraints (IPv6-only `db.<ref>.supabase.co` unreachable from local environment), token-authenticated SQL execution through Management API provides a reliable, auditable way to apply schema migrations remotely.

## 2026-03-14 — Auto-bootstrap first-login organization membership in dashboard guard
Rationale: Local/demo environments often start with authenticated users but no seeded `organization_members`; creating a personal organization plus owner membership on first protected-route access removes manual DB setup friction while keeping org-scoped RLS behavior intact.

## 2026-03-14 — Gate temporary auth bypass behind explicit env flag
Rationale: Development velocity is currently blocked by Supabase free-tier auth email throttling; using `AUTH_BYPASS_ENABLED` allows controlled short-term bypass without deleting auth code paths, so auth can be re-enabled instantly by flipping one env value.

## 2026-03-14 — Tighten `organization_members` write policies around ownership
Rationale: The previous self-insert/member-update policy allowed overly broad membership mutation paths; restricting insert/update/delete to org creators (bootstrap) and org owners closes privilege gaps while preserving first-login onboarding.

## 2026-03-14 — Expose supply-chain mapping via dedicated DTO-focused service layer
Rationale: Centralizing supplier-part tier linking and exposure/network assembly in `lib/supply-chain/mapping.ts` keeps API handlers thin, enforces reusable org-scoped query logic, and delivers stable UI-ready payloads across multiple endpoints.

## 2026-03-14 — In bypass mode, pin all API context to a single demo actor/org
Rationale: With `AUTH_BYPASS_ENABLED=true`, session-based auth is intentionally disabled; forcing server-side context to actor `Akash Bhavsar` and one resolved demo organization keeps CRUD and mapping endpoints usable without per-user auth state.

## 2026-03-14 — Render overview with direct server queries instead of placeholder content
Rationale: During bypass-demo mode, users need immediate visible product state; server-rendered KPI/list queries against the resolved org provide deterministic, zero-click feedback without requiring separate frontend data wiring first.

## 2026-03-14 — Enforce migration-before-seed ordering on remote environment
Rationale: `supabase/seed.sql` depends on M2 hardening constraints (`suppliers_org_name_key`, `facilities_org_supplier_name_key`) for idempotent upserts; applying seed before migration causes `ON CONFLICT` failures.

## 2026-03-14 — Pre-validate supplier IDs before risk_events insert rather than relying on FK violation
Rationale: Pre-checking all `affectedSupplierIds` against the org before writing the event row lets the API return a 422 with the exact invalid UUIDs in a structured `fieldErrors.affectedSupplierIds` array, which is far more actionable than a generic 409 FK-violation error that reveals nothing about which IDs failed.

## 2026-03-14 — Deduplicate affectedSupplierIds in service layer before insert
Rationale: `risk_event_suppliers` has `UNIQUE(risk_event_id, supplier_id)`; silently deduping via `Set` at the service layer prevents callers from triggering avoidable unique-constraint 500 errors when passing duplicate IDs.

## 2026-03-14 — Use two-step sequential insert for risk_events + risk_event_suppliers rather than a Supabase RPC
Rationale: Supabase JS client does not expose multi-statement transactions; pre-validating supplier IDs before the first insert eliminates the primary atomicity failure mode. A Supabase RPC is the production path but adds migration surface area outside M3.S1 scope.

## 2026-03-14 — Round confidence to 2 decimal places at Zod parse time
Rationale: The DB column is `numeric(3,2)` (max 2 decimal places); applying `Math.round(val * 100) / 100` in the Zod transform ensures values are already within precision before reaching Postgres, avoiding silent truncation or constraint errors from float arithmetic drift.

## 2026-03-14 — Enrichment adapters use real APIs when keys are present; deterministic stubs otherwise
Rationale: External API keys (Brave Search, OpenWeatherMap) are optional in the hackathon environment; stubs keyed on event_type and region_code produce realistic, non-random demo data for consistent judging without requiring live API credentials.

## 2026-03-14 — Confidence rubric weights: 40% base + 30% source count + 30% freshness
Rationale: Manual ingestion confidence is the most reliable signal and should dominate; source count rewards corroboration; freshness decays linearly over 72 hours to reflect stale-data risk. This three-factor rubric is simple to explain and tune.

## 2026-03-14 — Return HTTP 200 (not 409) for duplicate risk events with isDuplicate: true
Rationale: A duplicate event is not an error — it is a valid idempotent outcome. Returning 409 would cause retry storms; returning the existing event with isDuplicate: true lets callers deduplicate their own state cleanly.

## 2026-03-14 — Write _provenance to every risk_events.payload at ingest time
Rationale: Source traceability is a core audit requirement; embedding provenance in the jsonb payload avoids a separate audit table while keeping all event metadata self-contained for export and compliance review.

## 2026-03-14 — Flag low-confidence events with _review block in payload rather than a separate DB column
Rationale: Adding a status column would require a migration; storing _review in the existing jsonb payload keeps M3.S3.c within the current schema and allows richer review metadata (reason, threshold, confidence value) without altering the table contract.
