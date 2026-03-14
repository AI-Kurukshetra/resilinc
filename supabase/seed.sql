-- M2.S1 seed strategy: realistic demo network for suppliers, facilities, parts, and tier links.
-- This script is idempotent and seeds against the first available auth user.

do $$
declare
  demo_user uuid;
  demo_org uuid;

  supplier_microcore uuid;
  supplier_pacific_pcb uuid;
  supplier_nordic_power uuid;
  supplier_sierra_optics uuid;
  supplier_atlas_logistics uuid;

  part_mcu uuid;
  part_pmic uuid;
  part_rf_frontend uuid;
  part_temp_sensor uuid;
  part_battery_cell uuid;
  part_display uuid;
  part_connector uuid;
  part_control_pcb uuid;
begin
  select u.id
  into demo_user
  from auth.users u
  order by u.created_at asc
  limit 1;

  if demo_user is null then
    raise notice 'Seed skipped: no auth.users found. Create a user first, then re-run seed.';
    return;
  end if;

  insert into public.profiles (user_id, full_name)
  values (demo_user, 'Demo Owner')
  on conflict (user_id) do update
    set full_name = excluded.full_name;

  select o.id
  into demo_org
  from public.organizations o
  where o.created_by = demo_user
  order by o.created_at asc
  limit 1;

  if demo_org is null then
    insert into public.organizations (name, created_by)
    values ('Apex Devices Group', demo_user)
    returning id into demo_org;
  else
    update public.organizations
    set name = 'Apex Devices Group'
    where id = demo_org;
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (demo_org, demo_user, 'owner')
  on conflict (organization_id, user_id) do update
    set role = excluded.role;

  insert into public.suppliers (organization_id, name, region_code, criticality, is_active)
  values (demo_org, 'MicroCore Semiconductors', 'TW', 5, true)
  on conflict (organization_id, name) do update
    set region_code = excluded.region_code,
        criticality = excluded.criticality,
        is_active = excluded.is_active
  returning id into supplier_microcore;

  insert into public.suppliers (organization_id, name, region_code, criticality, is_active)
  values (demo_org, 'Pacific PCB Works', 'MY', 4, true)
  on conflict (organization_id, name) do update
    set region_code = excluded.region_code,
        criticality = excluded.criticality,
        is_active = excluded.is_active
  returning id into supplier_pacific_pcb;

  insert into public.suppliers (organization_id, name, region_code, criticality, is_active)
  values (demo_org, 'Nordic Power Systems', 'DE', 4, true)
  on conflict (organization_id, name) do update
    set region_code = excluded.region_code,
        criticality = excluded.criticality,
        is_active = excluded.is_active
  returning id into supplier_nordic_power;

  insert into public.suppliers (organization_id, name, region_code, criticality, is_active)
  values (demo_org, 'Sierra Optics Manufacturing', 'MX', 3, true)
  on conflict (organization_id, name) do update
    set region_code = excluded.region_code,
        criticality = excluded.criticality,
        is_active = excluded.is_active
  returning id into supplier_sierra_optics;

  insert into public.suppliers (organization_id, name, region_code, criticality, is_active)
  values (demo_org, 'Atlas Logistics Components', 'US', 3, true)
  on conflict (organization_id, name) do update
    set region_code = excluded.region_code,
        criticality = excluded.criticality,
        is_active = excluded.is_active
  returning id into supplier_atlas_logistics;

  insert into public.facilities (organization_id, supplier_id, name, country_code, latitude, longitude)
  values (demo_org, supplier_microcore, 'Hsinchu Fab 3', 'TW', 24.80395, 120.97149)
  on conflict (organization_id, supplier_id, name) do update
    set country_code = excluded.country_code,
        latitude = excluded.latitude,
        longitude = excluded.longitude;

  insert into public.facilities (organization_id, supplier_id, name, country_code, latitude, longitude)
  values (demo_org, supplier_microcore, 'Tainan Packaging Plant', 'TW', 22.99973, 120.22703)
  on conflict (organization_id, supplier_id, name) do update
    set country_code = excluded.country_code,
        latitude = excluded.latitude,
        longitude = excluded.longitude;

  insert into public.facilities (organization_id, supplier_id, name, country_code, latitude, longitude)
  values (demo_org, supplier_pacific_pcb, 'Penang Circuit Campus', 'MY', 5.41413, 100.32875)
  on conflict (organization_id, supplier_id, name) do update
    set country_code = excluded.country_code,
        latitude = excluded.latitude,
        longitude = excluded.longitude;

  insert into public.facilities (organization_id, supplier_id, name, country_code, latitude, longitude)
  values (demo_org, supplier_nordic_power, 'Bavaria Cell Line', 'DE', 48.13512, 11.58198)
  on conflict (organization_id, supplier_id, name) do update
    set country_code = excluded.country_code,
        latitude = excluded.latitude,
        longitude = excluded.longitude;

  insert into public.facilities (organization_id, supplier_id, name, country_code, latitude, longitude)
  values (demo_org, supplier_nordic_power, 'Leipzig Assembly Hub', 'DE', 51.33970, 12.37307)
  on conflict (organization_id, supplier_id, name) do update
    set country_code = excluded.country_code,
        latitude = excluded.latitude,
        longitude = excluded.longitude;

  insert into public.facilities (organization_id, supplier_id, name, country_code, latitude, longitude)
  values (demo_org, supplier_sierra_optics, 'Monterrey Optics Plant', 'MX', 25.68661, -100.31611)
  on conflict (organization_id, supplier_id, name) do update
    set country_code = excluded.country_code,
        latitude = excluded.latitude,
        longitude = excluded.longitude;

  insert into public.facilities (organization_id, supplier_id, name, country_code, latitude, longitude)
  values (demo_org, supplier_atlas_logistics, 'Phoenix Integration Center', 'US', 33.44838, -112.07404)
  on conflict (organization_id, supplier_id, name) do update
    set country_code = excluded.country_code,
        latitude = excluded.latitude,
        longitude = excluded.longitude;

  insert into public.parts (organization_id, part_number, description, criticality)
  values (demo_org, 'MCU-9000', 'Automotive-grade microcontroller', 5)
  on conflict (organization_id, part_number) do update
    set description = excluded.description,
        criticality = excluded.criticality
  returning id into part_mcu;

  insert into public.parts (organization_id, part_number, description, criticality)
  values (demo_org, 'PMIC-440', 'Power management IC', 5)
  on conflict (organization_id, part_number) do update
    set description = excluded.description,
        criticality = excluded.criticality
  returning id into part_pmic;

  insert into public.parts (organization_id, part_number, description, criticality)
  values (demo_org, 'RF-FRONT-88', 'RF front-end module', 4)
  on conflict (organization_id, part_number) do update
    set description = excluded.description,
        criticality = excluded.criticality
  returning id into part_rf_frontend;

  insert into public.parts (organization_id, part_number, description, criticality)
  values (demo_org, 'SENSOR-TEMP-12', 'Precision thermal sensor', 3)
  on conflict (organization_id, part_number) do update
    set description = excluded.description,
        criticality = excluded.criticality
  returning id into part_temp_sensor;

  insert into public.parts (organization_id, part_number, description, criticality)
  values (demo_org, 'BATT-CELL-50', 'High-density lithium battery cell', 4)
  on conflict (organization_id, part_number) do update
    set description = excluded.description,
        criticality = excluded.criticality
  returning id into part_battery_cell;

  insert into public.parts (organization_id, part_number, description, criticality)
  values (demo_org, 'LCD-7IN-IPS', '7 inch IPS display panel', 3)
  on conflict (organization_id, part_number) do update
    set description = excluded.description,
        criticality = excluded.criticality
  returning id into part_display;

  insert into public.parts (organization_id, part_number, description, criticality)
  values (demo_org, 'CONNECTOR-Q12', 'Rugged board connector', 2)
  on conflict (organization_id, part_number) do update
    set description = excluded.description,
        criticality = excluded.criticality
  returning id into part_connector;

  insert into public.parts (organization_id, part_number, description, criticality)
  values (demo_org, 'PCB-6L-CTRL', 'Six-layer control PCB', 4)
  on conflict (organization_id, part_number) do update
    set description = excluded.description,
        criticality = excluded.criticality
  returning id into part_control_pcb;

  insert into public.supplier_parts (organization_id, supplier_id, part_id, tier_level)
  values
    (demo_org, supplier_microcore, part_mcu, 1),
    (demo_org, supplier_microcore, part_pmic, 1),
    (demo_org, supplier_microcore, part_rf_frontend, 2),
    (demo_org, supplier_pacific_pcb, part_control_pcb, 1),
    (demo_org, supplier_pacific_pcb, part_connector, 2),
    (demo_org, supplier_nordic_power, part_battery_cell, 1),
    (demo_org, supplier_nordic_power, part_pmic, 2),
    (demo_org, supplier_sierra_optics, part_display, 1),
    (demo_org, supplier_sierra_optics, part_temp_sensor, 1),
    (demo_org, supplier_atlas_logistics, part_connector, 3),
    (demo_org, supplier_atlas_logistics, part_display, 2)
  on conflict (supplier_id, part_id) do update
    set organization_id = excluded.organization_id,
        tier_level = excluded.tier_level;
end
$$;
