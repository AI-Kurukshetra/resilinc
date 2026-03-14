-- M2.S1 hardening: policy tightening + index coverage for supply-chain CRUD and mapping

create index if not exists idx_organization_members_user_created
  on public.organization_members (user_id, created_at desc);

create index if not exists idx_facilities_org_supplier
  on public.facilities (organization_id, supplier_id);

create index if not exists idx_supplier_parts_org_supplier
  on public.supplier_parts (organization_id, supplier_id);

create index if not exists idx_supplier_parts_org_part
  on public.supplier_parts (organization_id, part_id);

create index if not exists idx_risk_event_suppliers_org_supplier
  on public.risk_event_suppliers (organization_id, supplier_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'suppliers_org_name_key'
      and conrelid = 'public.suppliers'::regclass
  ) then
    alter table public.suppliers
      add constraint suppliers_org_name_key unique (organization_id, name);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'facilities_org_supplier_name_key'
      and conrelid = 'public.facilities'::regclass
  ) then
    alter table public.facilities
      add constraint facilities_org_supplier_name_key unique (organization_id, supplier_id, name);
  end if;
end
$$;

create or replace function public.is_org_owner(target_org uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  );
$$;

drop policy if exists "organization_members_self_insert" on public.organization_members;
drop policy if exists "organization_members_owner_update" on public.organization_members;
drop policy if exists "organization_members_owner_delete" on public.organization_members;
drop policy if exists "organization_members_owner_insert" on public.organization_members;
drop policy if exists "organization_members_self_bootstrap_insert" on public.organization_members;

create policy "organization_members_self_bootstrap_insert"
on public.organization_members
for insert
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.organizations o
    where o.id = organization_id
      and o.created_by = (select auth.uid())
  )
);

create policy "organization_members_owner_insert"
on public.organization_members
for insert
with check (public.is_org_owner(organization_id));

create policy "organization_members_owner_update"
on public.organization_members
for update
using (public.is_org_owner(organization_id))
with check (public.is_org_owner(organization_id));

create policy "organization_members_owner_delete"
on public.organization_members
for delete
using (public.is_org_owner(organization_id));
