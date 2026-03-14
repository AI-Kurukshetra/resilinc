---
name: db-migration
description: >
  Create Supabase migration files with RLS policies and schema docs updates.
allow_implicit_invocation: true
---

# DB Migration Skill

- Create `supabase/migrations/YYYYMMDDHHMMSS_name.sql`.
- Enable RLS and use `(select auth.uid())` in policies.
- Update `doc/SCHEMA.md` and `doc/CHANGELOG.md`.
