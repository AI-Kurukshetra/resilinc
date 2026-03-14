---
name: risk-intelligence-ingestion
description: >
  Ingest external risk intelligence and normalize to internal event schema.
allow_implicit_invocation: true
---

# Risk Intelligence Ingestion Skill

- Query MCP sources for disruptions by supplier and region.
- Normalize, deduplicate, and classify events.
- Persist into `risk_events` with source provenance and confidence.
