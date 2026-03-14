# Development Plan

## Phase 1 — Project Setup
- Initialize Next.js 15 App Router project with TypeScript strict.
- Configure Tailwind, shadcn/ui, and shared utilities.
- Configure `.codex` multi-agent role files and baseline skills.

## Phase 2 — Database & Backend
- Apply initial Supabase migration.
- Enable RLS and org membership policies.
- Build seed script with realistic suppliers, facilities, and events.
- Implement auth + protected dashboard layout.

## Phase 3 — Core Agents & Skills
- Implement ingestion and scoring jobs.
- Add incident playbook generation logic.
- Add supplier mapping routines.

## Phase 4 — Next.js UI
- Dashboard: risk summary, top alerts, supplier risk list.
- Supplier profile page with risk trend and dependencies.
- Incident board with status progression.
- Reports page with downloadable summary.

## Phase 5 — MCP Integration
- Wire web/document/weather MCP tools for enrichment.
- Normalize MCP outputs and persist provenance.
- Add fallback strategy when source confidence is low.

## Phase 6 — Testing
- Unit: validators, scoring, API handlers.
- E2E: login, dashboard load, acknowledge alert, close incident.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`.

## Phase 7 — Vercel Deployment
- Configure Vercel project and environment variables.
- Run production build and smoke test.
- Final demo walkthrough and submission package.
