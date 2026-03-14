# Agent Workflow

## Agents
- `research-agent`: extracts requirements and competitive insights.
- `planning-agent`: decomposes features into implementation tasks.
- `execution-agent`: builds database, API, and UI features.
- `validation-agent`: runs tests/e2e and performs risk-first review.

## Orchestration Sequence
1. `research-agent` reads `doc/*`, blueprint, and hackathon constraints.
2. `planning-agent` updates roadmap and acceptance criteria.
3. `execution-agent` runs `db-migration` -> `api-endpoint` -> `frontend-design`.
4. `validation-agent` runs `agent-browser` and `pr-review`.
5. Coordinator updates `doc/TASKS.md`, `doc/PROGRESS.md`, `doc/CHANGELOG.md`, `doc/DECISIONS.md`.

## Handoff Template

```text
[YYYY-MM-DD HH:MM] $agent-name — <completed work>
  Output files:
    + path/to/file
  Checks passed: pnpm lint ✓  pnpm typecheck ✓  pnpm test ✓
  Next handoff to: $next-agent — <next objective>
```

## Definition of Done (Hackathon)
- Auth works.
- Seed data visible on first login.
- Dashboard + alerts + incident actions functional.
- Mobile-friendly UI and no critical console errors.
- Vercel deployment URL + demo video ready.
