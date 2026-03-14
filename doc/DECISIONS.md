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
