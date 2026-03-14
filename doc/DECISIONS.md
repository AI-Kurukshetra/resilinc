# DECISIONS

## 2026-03-14 — Keep MVP narrow and demo-first
Rationale: Hackathon judging and time constraints favor a reliable end-to-end workflow over breadth.

## 2026-03-14 — Multi-tenant org-scoped schema with strict RLS
Rationale: Required for security baseline and future enterprise expansion.

## 2026-03-14 — Skill-driven agent architecture in-repo
Rationale: Reusable skills reduce future setup overhead and enforce consistent workflows.

## 2026-03-14 — MCP enrichment as modular pipeline
Rationale: Enables incremental data-source expansion without core schema rewrites.

## 2026-03-14 — Include runnable local scaffold config in foundation
Rationale: Reduces setup friction during hackathon by letting future agents start implementation immediately.

## 2026-03-14 — Use one docs root: `doc/` with `doc/blueprint/`
Rationale: Eliminates ambiguity between `doc/` and `docs/` while preserving required AGENTS.md tracking files.

## 2026-03-14 — Add a mandatory preflight control loop
Rationale: Ensures every new agent reads the same source-of-truth files, picks the correct skill path, and avoids redundant structures before handoff.

## 2026-03-14 — Track delivery by hierarchical task IDs tied to prompts
Rationale: `Mx.Sy(.z)` IDs remove ambiguity, enable deterministic handoffs, and allow one-subtask-at-a-time execution across agents.
