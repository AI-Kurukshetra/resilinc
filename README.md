# Resilinc Lite — Supply Chain Risk Intelligence (Hackathon Build)

This repository contains the architecture blueprint and foundation scaffold for a Next.js + Supabase + Vercel application designed for the AI Mahakurukshetra (March 14, 2026).

## Quick Start (when dependencies are installed)

1. `pnpm install`
2. `cp .env.example .env.local`
3. Fill Supabase credentials
4. `pnpm dev`
5. `./scripts/preflight.sh`

## Vercel Deployment (GitHub Auto-Deploy)

1. Push `main` to GitHub (`https://github.com/AI-Kurukshetra/resilinc`).
2. Import the repo in Vercel and enable automatic deployments from GitHub.
3. In Vercel Project Settings -> Environment Variables, set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy and verify:
   - App loads at the assigned Vercel URL.
   - `GET /api/health` returns `200` and `"status":"ok"`.

Optional CLI flow:
- `vercel link`
- `vercel env add NEXT_PUBLIC_SUPABASE_URL production`
- `vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production`
- `vercel --prod`

## Core Docs

- `doc/blueprint/problem_understanding.md`
- `doc/blueprint/system_architecture.md`
- `doc/blueprint/skills_catalog.md`
- `doc/blueprint/agent_workflow.md`
- `doc/blueprint/development_plan.md`
- `doc/blueprint/mcp_integration_plan.md`

## Mandatory Context Docs for Agents

- `doc/PRD.md`
- `doc/TASKS.md`
- `doc/PROGRESS.md`
- `doc/BLOCKERS.md`
- `doc/CHANGELOG.md`
- `doc/DECISIONS.md`
- `doc/SCHEMA.md`
- `doc/IMPLEMENTATION_STATE.md`
- `doc/SKILL_ROUTER.md`

## Prompt Guardrail

- Reusable suffix for every prompt: `doc/PROMPT_APPENDIX.md`
