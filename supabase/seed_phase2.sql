-- Phase 2 seed data (M8–M12): financial profiles, mitigation plans, compliance,
-- ESG scores, financial health, geopolitical profiles, performance records,
-- inventory levels, integrations, transportation routes, and notifications.
-- Requires Phase 1 seed.sql to be applied first.

do $$
declare
  demo_org uuid;
  s_microcore uuid;
  s_pacific uuid;
  s_nordic uuid;
  s_sierra uuid;
  s_atlas uuid;
  p_mcu uuid;
  p_pmic uuid;
  p_rf uuid;
  p_battery uuid;
  p_display uuid;
  p_connector uuid;
  mp1 uuid;
  mp2 uuid;
  cf1 uuid;
  cf2 uuid;
  fac_hsinchu uuid;
  fac_penang uuid;
  fac_bavaria uuid;
begin
  -- Resolve demo org
  select o.id into demo_org
  from public.organizations o
  order by o.created_at asc limit 1;

  if demo_org is null then
    raise notice 'Phase 2 seed skipped: no organization found. Run Phase 1 seed first.';
    return;
  end if;

  -- Resolve suppliers
  select id into s_microcore from public.suppliers where organization_id = demo_org and name = 'MicroCore Semiconductors';
  select id into s_pacific from public.suppliers where organization_id = demo_org and name = 'Pacific PCB Works';
  select id into s_nordic from public.suppliers where organization_id = demo_org and name = 'Nordic Power Systems';
  select id into s_sierra from public.suppliers where organization_id = demo_org and name = 'Sierra Optics Manufacturing';
  select id into s_atlas from public.suppliers where organization_id = demo_org and name = 'Atlas Logistics Components';

  -- Resolve parts
  select id into p_mcu from public.parts where organization_id = demo_org and part_number = 'MCU-9000';
  select id into p_pmic from public.parts where organization_id = demo_org and part_number = 'PMIC-440';
  select id into p_rf from public.parts where organization_id = demo_org and part_number = 'RF-FRONT-88';
  select id into p_battery from public.parts where organization_id = demo_org and part_number = 'BATT-CELL-50';
  select id into p_display from public.parts where organization_id = demo_org and part_number = 'LCD-7IN-IPS';
  select id into p_connector from public.parts where organization_id = demo_org and part_number = 'CONNECTOR-Q12';

  -- Resolve facilities
  select id into fac_hsinchu from public.facilities where organization_id = demo_org and name = 'Hsinchu Fab 3';
  select id into fac_penang from public.facilities where organization_id = demo_org and name = 'Penang Circuit Campus';
  select id into fac_bavaria from public.facilities where organization_id = demo_org and name = 'Bavaria Cell Line';

  -- M8.S3: Part financial profiles (4 demo parts)
  insert into public.part_financial_profiles (organization_id, part_id, annual_spend, unit_cost, annual_volume, lead_time_days, currency)
  values
    (demo_org, p_mcu, 2400000.00, 12.50, 192000, 14, 'USD'),
    (demo_org, p_pmic, 1800000.00, 8.75, 205714, 10, 'USD'),
    (demo_org, p_battery, 960000.00, 24.00, 40000, 21, 'USD'),
    (demo_org, p_display, 540000.00, 18.00, 30000, 18, 'USD')
  on conflict (organization_id, part_id) do update
    set annual_spend = excluded.annual_spend,
        unit_cost = excluded.unit_cost,
        annual_volume = excluded.annual_volume,
        lead_time_days = excluded.lead_time_days;

  -- M9.S1: Mitigation plans (2 plans, 3 actions each)
  insert into public.mitigation_plans (organization_id, supplier_id, title, description, strategy, status, priority, target_date)
  values (demo_org, s_microcore, 'Taiwan Semiconductor Dual-Source Strategy', 'Establish secondary MCU source to reduce single-point-of-failure risk from TW geopolitical exposure.', 'mitigate', 'active', 5, now() + interval '90 days')
  returning id into mp1;

  insert into public.mitigation_actions (plan_id, organization_id, title, status, notes)
  values
    (mp1, demo_org, 'Identify qualified alternate MCU supplier in KR/JP', 'completed', 'Shortlisted 3 candidates from KR'),
    (mp1, demo_org, 'Complete qualification testing with top candidate', 'in_progress', 'Testing batch received 2026-03-10'),
    (mp1, demo_org, 'Negotiate volume pricing and establish supply agreement', 'pending', null);

  insert into public.mitigation_plans (organization_id, supplier_id, title, description, strategy, status, priority, target_date)
  values (demo_org, s_nordic, 'Battery Cell Safety Stock Buffer', 'Increase safety stock from 2 weeks to 4 weeks to cover EU logistics disruptions.', 'accept', 'draft', 3, now() + interval '60 days')
  returning id into mp2;

  insert into public.mitigation_actions (plan_id, organization_id, title, status, notes)
  values
    (mp2, demo_org, 'Calculate revised safety stock quantities', 'pending', null),
    (mp2, demo_org, 'Secure warehouse capacity for additional inventory', 'pending', null),
    (mp2, demo_org, 'Update reorder triggers in ERP system', 'pending', null);

  -- M9.S2: Compliance frameworks (2 frameworks, 6 items)
  insert into public.compliance_frameworks (organization_id, name, description, category)
  values (demo_org, 'ISO 28000 Supply Chain Security', 'International standard for supply chain security management systems.', 'industry')
  returning id into cf1;

  insert into public.compliance_items (framework_id, organization_id, supplier_id, requirement, status, evidence_notes)
  values
    (cf1, demo_org, s_microcore, 'Annual security risk assessment conducted', 'compliant', 'Assessment completed 2026-02-15'),
    (cf1, demo_org, s_pacific, 'Access control policies documented', 'compliant', 'Policy v3.2 on file'),
    (cf1, demo_org, s_nordic, 'Incident response plan tested within 12 months', 'non_compliant', 'Last test was 2024-11; overdue');

  insert into public.compliance_frameworks (organization_id, name, description, category)
  values (demo_org, 'EU Conflict Minerals Regulation', 'Due diligence obligations for importers of tin, tantalum, tungsten, and gold.', 'regulatory')
  returning id into cf2;

  insert into public.compliance_items (framework_id, organization_id, supplier_id, requirement, status, evidence_notes)
  values
    (cf2, demo_org, s_microcore, 'Smelter/refiner identification and RMAP audit', 'compliant', 'All smelters RMAP conformant'),
    (cf2, demo_org, s_sierra, 'Supply chain due diligence report published', 'partially_compliant', 'Draft report pending review'),
    (cf2, demo_org, s_atlas, 'Third-party audit of mineral sourcing', 'not_assessed', null);

  -- M10.S1: ESG scores for all 5 suppliers
  insert into public.supplier_esg_scores (organization_id, supplier_id, environmental_score, social_score, governance_score, composite_score)
  values
    (demo_org, s_microcore, 72.00, 68.00, 80.00, 72.80),
    (demo_org, s_pacific, 65.00, 70.00, 60.00, 65.50),
    (demo_org, s_nordic, 85.00, 78.00, 82.00, 82.00),
    (demo_org, s_sierra, 55.00, 62.00, 58.00, 58.20),
    (demo_org, s_atlas, 60.00, 75.00, 70.00, 67.75)
  on conflict (organization_id, supplier_id) do update
    set environmental_score = excluded.environmental_score,
        social_score = excluded.social_score,
        governance_score = excluded.governance_score,
        composite_score = excluded.composite_score;

  -- M10.S2: Financial health for all 5 suppliers
  insert into public.supplier_financial_health (organization_id, supplier_id, credit_rating, altman_z_score, revenue_trend, debt_to_equity, days_payable_outstanding, financial_risk_level)
  values
    (demo_org, s_microcore, 'A', 3.200, 'growing', 0.450, 45, 'low'),
    (demo_org, s_pacific, 'BBB', 2.800, 'stable', 0.720, 60, 'medium'),
    (demo_org, s_nordic, 'AA', 3.500, 'growing', 0.300, 30, 'low'),
    (demo_org, s_sierra, 'BB', 2.100, 'declining', 1.200, 90, 'high'),
    (demo_org, s_atlas, 'BBB', 2.900, 'stable', 0.550, 50, 'medium')
  on conflict (organization_id, supplier_id) do update
    set credit_rating = excluded.credit_rating,
        altman_z_score = excluded.altman_z_score,
        revenue_trend = excluded.revenue_trend,
        financial_risk_level = excluded.financial_risk_level;

  -- M10.S3: Geopolitical risk profiles (5 regions)
  insert into public.geopolitical_risk_profiles (organization_id, region_code, risk_level, stability_index, sanctions_active, trade_restriction_notes)
  values
    (demo_org, 'TW', 'high', 42.00, false, 'Cross-strait tensions; potential semiconductor export restrictions'),
    (demo_org, 'MY', 'low', 78.00, false, 'Stable trade environment; ASEAN integration benefits'),
    (demo_org, 'DE', 'low', 88.00, false, 'EU regulatory compliance requirements; strong rule of law'),
    (demo_org, 'MX', 'medium', 55.00, false, 'Nearshoring growth offset by regional security concerns'),
    (demo_org, 'US', 'low', 82.00, false, 'Domestic sourcing; subject to CHIPS Act incentives')
  on conflict (organization_id, region_code) do update
    set risk_level = excluded.risk_level,
        stability_index = excluded.stability_index,
        sanctions_active = excluded.sanctions_active,
        trade_restriction_notes = excluded.trade_restriction_notes;

  -- M11.S1: Performance records (3 per supplier = 15 records)
  insert into public.supplier_performance_records (organization_id, supplier_id, period_start, period_end, on_time_delivery_rate, quality_rejection_rate, lead_time_variance_days, responsiveness_score, overall_rating)
  values
    (demo_org, s_microcore, '2025-10-01', '2025-12-31', 94.50, 1.20, 2, 4, 89.12),
    (demo_org, s_microcore, '2026-01-01', '2026-01-31', 92.00, 1.50, 3, 4, 86.55),
    (demo_org, s_microcore, '2026-02-01', '2026-02-28', 96.00, 0.80, 1, 5, 92.46),
    (demo_org, s_pacific, '2025-10-01', '2025-12-31', 88.00, 3.50, 4, 3, 78.75),
    (demo_org, s_pacific, '2026-01-01', '2026-01-31', 90.00, 2.80, 3, 3, 81.96),
    (demo_org, s_pacific, '2026-02-01', '2026-02-28', 91.50, 2.20, 2, 4, 85.31),
    (demo_org, s_nordic, '2025-10-01', '2025-12-31', 97.00, 0.50, 1, 5, 94.55),
    (demo_org, s_nordic, '2026-01-01', '2026-01-31', 96.50, 0.60, 0, 5, 94.42),
    (demo_org, s_nordic, '2026-02-01', '2026-02-28', 98.00, 0.30, 0, 5, 96.11),
    (demo_org, s_sierra, '2025-10-01', '2025-12-31', 82.00, 5.50, 6, 3, 72.55),
    (demo_org, s_sierra, '2026-01-01', '2026-01-31', 85.00, 4.20, 5, 3, 76.74),
    (demo_org, s_sierra, '2026-02-01', '2026-02-28', 84.00, 4.80, 4, 3, 75.06),
    (demo_org, s_atlas, '2025-10-01', '2025-12-31', 91.00, 2.00, 2, 4, 84.80),
    (demo_org, s_atlas, '2026-01-01', '2026-01-31', 93.00, 1.80, 1, 4, 87.46),
    (demo_org, s_atlas, '2026-02-01', '2026-02-28', 92.00, 1.50, 2, 4, 86.55);

  -- M11.S2: Inventory levels (6 parts)
  insert into public.part_inventory_levels (organization_id, part_id, current_stock, safety_stock, reorder_point, max_stock, avg_daily_consumption, days_of_supply, risk_flag)
  values
    (demo_org, p_mcu, 12000, 5000, 8000, 25000, 530.00, 22.64, 'adequate'),
    (demo_org, p_pmic, 8500, 4000, 6000, 20000, 570.00, 14.91, 'adequate'),
    (demo_org, p_rf, 2200, 1500, 2500, 8000, 180.00, 12.22, 'low'),
    (demo_org, p_battery, 800, 1000, 1500, 5000, 110.00, 7.27, 'critical'),
    (demo_org, p_display, 3500, 1000, 2000, 8000, 85.00, 41.18, 'adequate'),
    (demo_org, p_connector, 15000, 3000, 5000, 30000, 200.00, 75.00, 'adequate')
  on conflict (organization_id, part_id) do update
    set current_stock = excluded.current_stock,
        safety_stock = excluded.safety_stock,
        reorder_point = excluded.reorder_point,
        avg_daily_consumption = excluded.avg_daily_consumption,
        days_of_supply = excluded.days_of_supply,
        risk_flag = excluded.risk_flag;

  -- M11.S3: Integration records (3)
  insert into public.integrations (organization_id, name, type, status, config)
  values
    (demo_org, 'SAP S/4HANA Connector', 'api_connector', 'active', '{"endpoint": "https://sap.example.com/api", "version": "2.1"}'),
    (demo_org, 'Weather Alert Webhook', 'webhook', 'active', '{"url": "https://hooks.example.com/weather", "events": ["severe_weather"]}'),
    (demo_org, 'Manual Data Import', 'manual', 'inactive', '{}')
  on conflict (organization_id, name) do update
    set type = excluded.type,
        status = excluded.status,
        config = excluded.config;

  -- M12.S2: Transportation routes (3)
  insert into public.transportation_routes (organization_id, name, origin_facility_id, destination_name, transport_mode, estimated_transit_days, risk_level, active_disruptions)
  values
    (demo_org, 'Taiwan-US MCU Shipment', fac_hsinchu, 'Phoenix Integration Center', 'ocean', 28, 'medium', null),
    (demo_org, 'Malaysia-DE PCB Express', fac_penang, 'Leipzig Assembly Hub', 'air', 3, 'low', null),
    (demo_org, 'Germany Internal Transfer', fac_bavaria, 'Leipzig Assembly Hub', 'road', 1, 'low', null);

  -- M12.S1: Notifications (5 seed entries)
  insert into public.notifications (organization_id, title, message, type, reference_type)
  values
    (demo_org, 'System: Phase 2 Features Active', 'All M8-M12 features have been deployed. Explore mitigation plans, compliance tracking, and more.', 'system', 'system'),
    (demo_org, 'Alert: MicroCore Semiconductors Risk Elevated', 'Risk score for MicroCore Semiconductors has exceeded threshold. Review recommended.', 'alert', 'alert'),
    (demo_org, 'Compliance: ISO 28000 Review Overdue', 'Nordic Power Systems incident response plan test is overdue by 15 months.', 'compliance', 'compliance'),
    (demo_org, 'Mitigation: Dual-Source Strategy In Progress', 'Qualification testing for alternate MCU supplier is underway.', 'mitigation', 'mitigation'),
    (demo_org, 'Incident: Supply Chain Disruption Response', 'An incident response has been initiated for a critical supplier risk event.', 'incident', 'incident');

  raise notice 'Phase 2 seed data applied successfully for org %', demo_org;
end
$$;
