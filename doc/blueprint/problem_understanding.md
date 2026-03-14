# Problem Understanding

## Core Problem
Global supply chains are vulnerable to disruptions (natural disasters, geopolitical events, logistics bottlenecks, supplier failures). Teams need an operational system that converts fragmented risk signals into prioritized actions quickly.

## Key Users
- Supply Chain Risk Manager: monitors disruptions, acts on alerts.
- Procurement Lead: identifies alternate suppliers and exposure.
- Operations Leader: manages incident response and continuity.
- Executive Stakeholder: tracks business impact and resilience KPIs.

## Main Workflows
1. Onboard organization, suppliers, facilities, and critical parts.
2. Continuously ingest external risk signals.
3. Correlate risks to supplier/facility/region exposure.
4. Generate risk scores, trigger alerts, and assign response actions.
5. Track mitigation tasks and incident outcomes.
6. Export concise executive risk reports.

## Expected Outputs
- Real-time risk dashboard with severity tiers.
- Supplier and region risk scores.
- Alert feed with acknowledgment and owner assignment.
- Incident response playbooks and action logs.
- Audit-ready history and simple weekly report summary.

## Evaluation Criteria (from hackathon guidance)
- Product Hunt ranking and engagement quality.
- Functional completeness of core journeys.
- Usability (clean UX, mobile fit, seeded demo data).
- Code quality and maintainable structure.
- Security baseline (auth, validation, no exposed secrets).
- Demo clarity (5-minute walkthrough with live app).

## System Requirements
- Framework: Next.js (App Router).
- Backend + DB + Auth: Supabase.
- Deployment: Vercel.
- AI-assisted development flow via Codex/Claude.
- Seed data required for first-run experience.
- End-to-end deployable with environment-based config.
