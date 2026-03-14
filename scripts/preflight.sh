#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

pass() {
  echo "[PASS] $1"
}

info() {
  echo "[INFO] $1"
}

required_docs=(
  "doc/TASKS.md"
  "doc/PROGRESS.md"
  "doc/BLOCKERS.md"
  "doc/CHANGELOG.md"
  "doc/DECISIONS.md"
  "doc/SCHEMA.md"
  "doc/IMPLEMENTATION_STATE.md"
  "doc/SKILL_ROUTER.md"
)

for file in "${required_docs[@]}"; do
  [[ -f "$file" ]] || fail "Missing required doc: $file"
done
pass "Required doc files exist"

[[ -d ".agents/skills" ]] || fail "Missing .agents/skills"
[[ -d ".codex/agents" ]] || fail "Missing .codex/agents"
pass "Agent runtime directories exist"

if [[ -d "docs" ]]; then
  fail "Found deprecated folder: docs/ (use doc/blueprint/)"
fi
if [[ -d "agents" ]]; then
  fail "Found redundant folder: agents/ (runtime skills are in .agents/)"
fi
pass "No deprecated duplicate directories"

required_skills=(
  "new-session"
  "frontend-design"
  "db-migration"
  "api-endpoint"
  "agent-browser"
  "pr-review"
  "risk-intelligence-ingestion"
  "risk-scoring"
  "incident-response-playbook"
  "supply-chain-mapping"
)

for skill in "${required_skills[@]}"; do
  [[ -f ".agents/skills/${skill}/SKILL.md" ]] || fail "Missing skill file: .agents/skills/${skill}/SKILL.md"
done
pass "Core skill definitions exist"

if command -v pnpm >/dev/null 2>&1; then
  if [[ -d node_modules ]]; then
    info "Running lint/typecheck/test gates"
    pnpm lint
    pnpm typecheck
    pnpm test
    pass "Code quality gates passed"
  else
    info "Skipping lint/typecheck/test: node_modules not present"
  fi
else
  info "Skipping lint/typecheck/test: pnpm not installed"
fi

pass "Preflight complete"
