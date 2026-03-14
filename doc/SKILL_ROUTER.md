# SKILL ROUTER

## Purpose
Deterministic routing guide so every agent picks the correct skill/tool and avoids redundant implementation.

## Task -> Skill Mapping
- Database schema, table changes, RLS, SQL: use `$db-migration`
- API routes, server actions, validation contracts: use `$api-endpoint`
- UI pages/components/layout/styling: use `$frontend-design`
- E2E user journeys and browser checks: use `$agent-browser`
- Diff review and release-readiness gate: use `$pr-review` (explicit)
- External disruption ingestion workflow: use `$risk-intelligence-ingestion`
- Supplier/region scoring logic: use `$risk-scoring`
- Alert-to-action task generation: use `$incident-response-playbook`
- Supplier tier/dependency topology work: use `$supply-chain-mapping`
- Session initialization and status summary: use `$new-session`

## Tool Selection Rules
- File discovery/search: `rg`, `rg --files`
- Local edits: `apply_patch` for focused edits, shell for scaffolding/moves
- Cross-file reads/checks: parallel shell reads
- Web data enrichment: MCP web tools only when required by task

## Anti-Redundancy Rules
- Documentation belongs only in `doc/` (blueprints under `doc/blueprint/`).
- Agent runtime skill specs belong only in `.agents/skills/`.
- Do not create duplicate folder aliases (`docs`, `agents`) unless explicitly required.
- Any new architecture decision must be added to `doc/DECISIONS.md`.
- Any schema change must update migration SQL + `doc/SCHEMA.md`.

## Mandatory Handoff Checklist
1. Files created/modified are listed in `doc/PROGRESS.md`.
2. `doc/TASKS.md` status updated with timestamp.
3. `doc/CHANGELOG.md` updated for code/schema changes.
4. `doc/DECISIONS.md` updated if a new design choice was made.
5. Run `scripts/preflight.sh` before declaring handoff complete.
