# Skills Catalog

## Skill: `risk-intelligence-ingestion`
- Purpose: Collect external disruption signals and normalize into `risk_events`.
- Input: source list, org filters, regions, supplier map.
- Output: normalized events with severity, confidence, source metadata.
- Internal logic: fetch -> dedupe -> classify -> map exposure -> persist.
- Used by: `execution-agent`.

## Skill: `supply-chain-mapping`
- Purpose: Build and maintain supplier-facility-part dependency graph.
- Input: suppliers, facilities, part mappings, tier links.
- Output: graph edges + exposure snapshots.
- Internal logic: validate entities -> build adjacency map -> store edges.
- Used by: `planning-agent`, `execution-agent`.

## Skill: `risk-scoring`
- Purpose: Generate weighted risk scores per supplier and region.
- Input: recent risk events, historical incidents, criticality weights.
- Output: score records, trend direction, explanation payload.
- Internal logic: weighted aggregation -> thresholding -> update score table.
- Used by: `execution-agent`.

## Skill: `incident-response-playbook`
- Purpose: Turn critical alerts into actionable incident tasks.
- Input: alert details, impacted suppliers/parts, SLA policy.
- Output: incident action checklist, owner assignments, deadlines.
- Internal logic: map severity to template -> generate actions -> assign owners.
- Used by: `execution-agent`, `validation-agent`.

## Skill: `frontend-design`
- Purpose: Build pages/components aligned to product UX goals.
- Input: feature requirements, design constraints, target flow.
- Output: UI files in `app/` and `components/`.
- Internal logic: information architecture -> component build -> accessibility checks.
- Used by: `execution-agent`.

## Skill: `db-migration`
- Purpose: Create migration SQL + document schema and RLS changes.
- Input: schema change request.
- Output: timestamped migration + `doc/SCHEMA.md` updates.
- Internal logic: DDL + indexes + RLS + policy verification.
- Used by: `execution-agent`.

## Skill: `api-endpoint`
- Purpose: Implement validated API routes and server actions.
- Input: endpoint contract and Zod schema.
- Output: route handlers + tests.
- Internal logic: validate -> authorize -> mutate/query -> structured response.
- Used by: `execution-agent`.

## Skill: `agent-browser`
- Purpose: Execute critical e2e journeys after UI/API changes.
- Input: target flow list.
- Output: Playwright specs and run report.
- Internal logic: navigate -> assert -> record pass/fail evidence.
- Used by: `validation-agent`.

## Skill: `pr-review`
- Purpose: Risk-focused code review before commit.
- Input: git diff.
- Output: findings list by severity + release readiness.
- Internal logic: correctness, security, type safety, regression scan.
- Used by: `validation-agent`.
