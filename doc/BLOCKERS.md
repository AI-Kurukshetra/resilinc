# BLOCKERS

[2026-03-14] BLOCKER — coordinator
Problem:   GitHub push auto-deploy is blocked because `vercel git connect` fails with `You need to add a Login Connection to your GitHub account first. (400)`.
Attempted: Linked and deployed project successfully (`vercel link --yes`, `vercel --prod --yes`), then retried `vercel git connect https://github.com/AI-Kurukshetra/resilinc` (interactive + non-interactive), both blocked by missing GitHub Login Connection.
Needs:     In Vercel account settings, add GitHub Login Connection and grant access to repo `AI-Kurukshetra/resilinc`, then retry `vercel git connect`.

[2026-03-14] BLOCKER — coordinator
Problem:   Remote Supabase schema is behind M4 in active environment, and direct migration application is blocked from this runtime.
Attempted: Tried `supabase db push` against linked project and direct `--db-url` flow (with/without HTTPS DNS resolver); blocked by missing project link/access token and IPv6-only DB network reachability (`network is unreachable`).
Needs:     Apply `supabase/migrations/20260314183000_m4_risk_alert_incident_workflows.sql` from a network that can reach Supabase DB or via Management API token flow, then re-run Playwright lifecycle tests.
