-- Initial MVP schema for Resilinc Lite

create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'analyst', 'viewer')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  region_code text,
  criticality smallint not null default 3 check (criticality between 1 and 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  country_code text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  part_number text not null,
  description text,
  criticality smallint not null default 3 check (criticality between 1 and 5),
  created_at timestamptz not null default now(),
  unique (organization_id, part_number)
);

create table if not exists public.supplier_parts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  part_id uuid not null references public.parts(id) on delete cascade,
  tier_level smallint not null default 1,
  created_at timestamptz not null default now(),
  unique (supplier_id, part_id)
);

create table if not exists public.risk_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null,
  severity smallint not null check (severity between 1 and 5),
  confidence numeric(3,2) not null check (confidence >= 0 and confidence <= 1),
  region_code text,
  source_url text,
  source_name text,
  observed_at timestamptz not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.risk_event_suppliers (
  id uuid primary key default gen_random_uuid(),
  risk_event_id uuid not null references public.risk_events(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  impact_level smallint not null default 3 check (impact_level between 1 and 5),
  unique (risk_event_id, supplier_id)
);

create table if not exists public.supplier_risk_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  score numeric(5,2) not null,
  trend text not null check (trend in ('up', 'down', 'flat')),
  explanation jsonb not null default '{}'::jsonb,
  scored_at timestamptz not null default now(),
  unique (supplier_id)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  risk_event_id uuid references public.risk_events(id) on delete set null,
  title text not null,
  severity smallint not null check (severity between 1 and 5),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  acknowledged_by uuid references public.profiles(user_id) on delete set null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  alert_id uuid references public.alerts(id) on delete set null,
  title text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  owner_id uuid references public.profiles(user_id) on delete set null,
  started_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.incident_actions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  action_title text not null,
  owner_id uuid references public.profiles(user_id) on delete set null,
  due_at timestamptz,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done', 'blocked')),
  created_at timestamptz not null default now()
);

create index if not exists idx_suppliers_org on public.suppliers (organization_id);
create index if not exists idx_facilities_org on public.facilities (organization_id);
create index if not exists idx_parts_org on public.parts (organization_id);
create index if not exists idx_risk_events_org_observed on public.risk_events (organization_id, observed_at desc);
create index if not exists idx_alerts_org_status on public.alerts (organization_id, status);
create index if not exists idx_incidents_org_status on public.incidents (organization_id, status);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.suppliers enable row level security;
alter table public.facilities enable row level security;
alter table public.parts enable row level security;
alter table public.supplier_parts enable row level security;
alter table public.risk_events enable row level security;
alter table public.risk_event_suppliers enable row level security;
alter table public.supplier_risk_scores enable row level security;
alter table public.alerts enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_actions enable row level security;

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = (select auth.uid())
  );
$$;

create policy "profiles_select_self"
on public.profiles
for select
using (user_id = (select auth.uid()));

create policy "profiles_upsert_self"
on public.profiles
for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "organizations_member_select"
on public.organizations
for select
using (public.is_org_member(id));

create policy "organizations_insert_owner"
on public.organizations
for insert
with check (created_by = (select auth.uid()));

create policy "organization_members_member_read"
on public.organization_members
for select
using (public.is_org_member(organization_id));

create policy "organization_members_self_insert"
on public.organization_members
for insert
with check (user_id = (select auth.uid()));

create policy "organization_members_owner_update"
on public.organization_members
for update
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "org_scoped_suppliers"
on public.suppliers
for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "org_scoped_facilities"
on public.facilities
for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "org_scoped_parts"
on public.parts
for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "org_scoped_supplier_parts"
on public.supplier_parts
for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "org_scoped_risk_events"
on public.risk_events
for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "org_scoped_risk_event_suppliers"
on public.risk_event_suppliers
for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "org_scoped_risk_scores"
on public.supplier_risk_scores
for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "org_scoped_alerts"
on public.alerts
for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "org_scoped_incidents"
on public.incidents
for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "org_scoped_incident_actions"
on public.incident_actions
for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

insert into storage.buckets (id, name, public)
values ('incident-evidence', 'incident-evidence', false)
on conflict (id) do nothing;
