alter table public.alerts
  add column if not exists owner_id uuid references public.profiles(user_id) on delete set null,
  add column if not exists owner_assigned_at timestamptz,
  add column if not exists resolved_by uuid references public.profiles(user_id) on delete set null,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolution_note text;

create table if not exists public.alert_events (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null check (event_type in ('generated', 'escalated', 'owner_assigned', 'acknowledged', 'resolved')),
  actor_id uuid references public.profiles(user_id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_alert_events_org_created_at_desc
  on public.alert_events (organization_id, created_at desc);

create index if not exists idx_alert_events_alert_created_at_asc
  on public.alert_events (alert_id, created_at asc);

create index if not exists idx_alert_events_org_event_type
  on public.alert_events (organization_id, event_type);

create unique index if not exists idx_incidents_active_alert_unique
  on public.incidents (alert_id)
  where alert_id is not null and status in ('open', 'in_progress');

alter table public.alert_events enable row level security;

drop policy if exists "org_scoped_alert_events" on public.alert_events;

create policy "org_scoped_alert_events"
on public.alert_events
for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));
