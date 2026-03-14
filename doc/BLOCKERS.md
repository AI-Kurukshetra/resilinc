# BLOCKERS

[2026-03-14] BLOCKER — coordinator
Problem:   GitHub push auto-deploy is blocked because `vercel git connect` fails with `You need to add a Login Connection to your GitHub account first. (400)`.
Attempted: Linked and deployed project successfully (`vercel link --yes`, `vercel --prod --yes`), then retried `vercel git connect https://github.com/AI-Kurukshetra/resilinc` (interactive + non-interactive), both blocked by missing GitHub Login Connection.
Needs:     In Vercel account settings, add GitHub Login Connection and grant access to repo `AI-Kurukshetra/resilinc`, then retry `vercel git connect`.
