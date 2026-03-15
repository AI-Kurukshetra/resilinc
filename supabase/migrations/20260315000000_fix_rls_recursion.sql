-- Fix: is_org_member() was calling organization_members which has an RLS
-- policy that calls is_org_member(), causing infinite recursion
-- ("stack depth limit exceeded").
--
-- Solution: make the helper SECURITY DEFINER so it runs as the DB owner
-- and bypasses RLS on organization_members.

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = (select auth.uid())
  );
$$;
