-- Fix: Links user secir92769@niprack.com to "Apex Devices Group" and
-- removes any conflicting personal workspace so the app resolves the
-- seeded org first.
-- Run AFTER seed.sql, seed_phase2.sql, and seed_phase3.sql.

do $$
declare
  target_user uuid;
  seed_org uuid;
  personal_org uuid;
begin
  -- 1. Find the user
  select id into target_user
  from auth.users
  where email = 'secir92769@niprack.com';

  if target_user is null then
    raise exception 'User secir92769@niprack.com not found in auth.users';
  end if;

  -- 2. Find the seeded organization
  select id into seed_org
  from public.organizations
  where name = 'Apex Devices Group'
  limit 1;

  if seed_org is null then
    raise exception '"Apex Devices Group" not found. Run seed.sql first.';
  end if;

  -- 3. Find and remove any OTHER org this user owns (the auto-created personal workspace)
  --    This is the empty org that the dashboard layout bootstrap creates on first login.
  for personal_org in
    select o.id
    from public.organizations o
    where o.created_by = target_user
      and o.id != seed_org
  loop
    raise notice 'Removing empty personal org: %', personal_org;
    -- Delete membership first (cascades from org delete, but being explicit)
    delete from public.organization_members where organization_id = personal_org;
    delete from public.organizations where id = personal_org;
  end loop;

  -- 4. Also remove any memberships to non-seed orgs
  delete from public.organization_members
  where user_id = target_user
    and organization_id != seed_org;

  -- 5. Ensure profile exists
  insert into public.profiles (user_id, full_name)
  values (target_user, 'Demo Owner')
  on conflict (user_id) do update
    set full_name = excluded.full_name;

  -- 6. Ensure membership to seed org exists
  insert into public.organization_members (organization_id, user_id, role)
  values (seed_org, target_user, 'owner')
  on conflict (organization_id, user_id) do update
    set role = excluded.role;

  -- 7. Make this user the owner of the seed org
  update public.organizations
  set created_by = target_user
  where id = seed_org;

  raise notice 'SUCCESS: User % is now sole owner of Apex Devices Group (%)', target_user, seed_org;
end
$$;
