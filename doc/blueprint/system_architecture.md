# System Architecture

## Architecture Overview
The system is a multi-tenant SaaS app where each organization tracks suppliers, facilities, and disruptions. Next.js serves the web app and API routes, Supabase provides auth/database/storage, and MCP-enabled agent workflows enrich risk events from external sources.

### Frontend (Next.js)
- App Router with server components for data-heavy pages.
- Dashboard pages: overview, suppliers, alerts, incidents, reports.
- Client components only where interaction/state is required.

### Backend Logic
- API routes (`app/api/*`) for ingestion, scoring, alerting, and report generation.
- Server actions for authenticated CRUD flows.
- Validation via Zod at all API boundaries.

### Supabase Usage
- Auth: email/password or magic-link for users.
- Postgres: normalized tables for organizations, suppliers, risk events, alerts, incidents.
- RLS: all business tables protected by org membership policies.
- Storage: evidence files (incident attachments, supplier docs).
- Optional Edge Functions: scheduled ingestion and scoring jobs.

### AI Agent Orchestration
- Coordinator pattern controls specialist agents (research/planning/execution/validation).
- Skills are modular units under `.agents/skills/*` and reusable across sessions.
- Handoffs are logged into `doc/PROGRESS.md` with outputs and next gate.

### Deployment Flow (Vercel)
1. Push to GitHub.
2. Vercel builds Next.js app.
3. Environment variables injected at project level.
4. App connects to Supabase project.
5. Scheduled jobs trigger Supabase Edge Functions/cron endpoints.

## Data Flow
1. User logs in and accesses org-scoped dashboard.
2. External signals are ingested via MCP-enabled jobs.
3. Ingestion normalizes events into `risk_events`.
4. Scoring job updates `supplier_risk_scores`.
5. Alerting job creates `alerts` for high-risk items.
6. Users acknowledge alerts and create `incident_actions`.
7. Dashboard and reports query scored and aggregated data.

## Text Component Diagram

```text
[User Browser]
   |
   v
[Next.js App Router UI]
   |  (RSC + API routes + server actions)
   v
[Supabase Auth] ---- [Supabase Postgres + RLS] ---- [Supabase Storage]
   ^                         ^
   |                         |
[MCP Tools] --> [Ingestion/Scoring Agents] --> [Risk/Alert Tables]
   |
   +--> Web search / weather / geo / compliance enrichment

[Next.js on Vercel]
   |
   +--> Cron trigger endpoints / Edge jobs
```
