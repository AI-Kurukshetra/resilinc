# PROMPT APPENDIX

Use the block below as a suffix in every future prompt.

```text
Execution guardrails for this repo:
1) Read in order: doc/TASKS.md -> doc/PROGRESS.md -> doc/BLOCKERS.md -> doc/CHANGELOG.md -> doc/DECISIONS.md -> doc/SCHEMA.md -> doc/IMPLEMENTATION_STATE.md -> doc/SKILL_ROUTER.md -> doc/blueprint/E2E_DEVELOPMENT_PLAN.md.
2) Pick exactly one next unchecked subtask ID from doc/TASKS.md (format Mx.Sy or Mx.Sy.z), complete it fully, then update TASKS/PROGRESS/CHANGELOG/DECISIONS/SCHEMA as applicable.
3) Use skill routing from doc/SKILL_ROUTER.md. Do not create parallel folder structures or duplicate docs.
4) Before finalizing, run scripts/preflight.sh and report pass/fail. If pnpm exists and node_modules exists, run lint/typecheck/test too.
5) If blocked, append a blocker entry in doc/BLOCKERS.md using AGENTS.md format and stop.
6) In your final update, include: completed subtask IDs, files changed, checks run, and next recommended subtask ID.
```
