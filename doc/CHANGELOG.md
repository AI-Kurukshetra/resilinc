# CHANGELOG

## 2026-03-14
- Added foundational documentation set under `docs/`.
- Added multi-agent configuration (`.codex/config.toml`, `.codex/agents/*`).
- Added reusable skill scaffolds under `.agents/skills/*`.
- Added initial Next.js project skeleton (`app/`, `lib/`, `middleware.ts`).
- Added baseline project configuration (`package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `next-env.d.ts`, `app/globals.css`).
- Added Supabase migration `20260314110000_init_resilinc_mvp.sql` with tables, indexes, RLS, and policies.
- Added prompt templates and agent role placeholders.
- Consolidated blueprint docs into `doc/blueprint/` and removed duplicate `docs/` folder.
- Removed redundant `agents/` placeholder directory to avoid confusion with `.agents/`.
- Added control-loop docs: `doc/IMPLEMENTATION_STATE.md`, `doc/SKILL_ROUTER.md`, and `doc/PROMPT_APPENDIX.md`.
- Added `scripts/preflight.sh` to enforce required docs, skill availability, folder hygiene, and quality-gate execution when tooling exists.
- Added `doc/blueprint/E2E_DEVELOPMENT_PLAN.md` with strict delivery order, module decomposition, acceptance criteria, and copy-paste prompts per subtask.
- Reworked `doc/TASKS.md` into ID-based execution tracking (`Mx.Sy` / `Mx.Sy.z`) for agent-friendly progress management.
- Updated `suffix_prompt.md` to enforce single-subtask execution loop and mandatory completion reporting format.
