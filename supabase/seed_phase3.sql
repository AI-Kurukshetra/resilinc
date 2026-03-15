-- Phase 3 seed data: risk events, supplier risk scores, alerts, alert events,
-- incidents, and incident actions. Populates the core risk-response pipeline
-- for investor/client demo purposes.
-- Requires Phase 1 seed.sql and Phase 2 seed_phase2.sql to be applied first.

do $$
declare
  demo_org uuid;
  demo_user uuid;
  s_microcore uuid;
  s_pacific uuid;
  s_nordic uuid;
  s_sierra uuid;
  s_atlas uuid;

  -- Risk event IDs
  re_tw_strait uuid;
  re_tw_export uuid;
  re_tw_cyber uuid;
  re_my_flood uuid;
  re_my_quality uuid;
  re_de_reg uuid;
  re_de_energy uuid;
  re_mx_quake uuid;
  re_mx_quality uuid;
  re_mx_logistics uuid;
  re_us_tariff uuid;
  re_us_port uuid;
  re_tw_typhoon uuid;
  re_global_chip uuid;
  re_my_monsoon uuid;
  re_de_strike uuid;
  re_tw_fab_fire uuid;
  re_mx_cartel uuid;
  re_us_cyber uuid;
  re_global_shipping uuid;
  re_tw_power uuid;
  re_de_recall uuid;
  re_my_customs uuid;
  re_us_rail uuid;
  re_mx_env uuid;

  -- Alert IDs
  a1 uuid; a2 uuid; a3 uuid; a4 uuid; a5 uuid;
  a6 uuid; a7 uuid; a8 uuid; a9 uuid; a10 uuid;
  a11 uuid; a12 uuid; a13 uuid; a14 uuid; a15 uuid;
  a16 uuid; a17 uuid; a18 uuid; a19 uuid; a20 uuid;

  -- Incident IDs
  inc1 uuid; inc2 uuid; inc3 uuid; inc4 uuid; inc5 uuid;
  inc6 uuid; inc7 uuid; inc8 uuid; inc9 uuid; inc10 uuid;
begin
  -- Resolve demo org and user
  select o.id into demo_org
  from public.organizations o
  order by o.created_at asc limit 1;

  if demo_org is null then
    raise notice 'Phase 3 seed skipped: no organization found. Run Phase 1 seed first.';
    return;
  end if;

  select p.user_id into demo_user
  from public.profiles p
  order by p.created_at asc limit 1;

  -- Resolve suppliers
  select id into s_microcore from public.suppliers where organization_id = demo_org and name = 'MicroCore Semiconductors';
  select id into s_pacific from public.suppliers where organization_id = demo_org and name = 'Pacific PCB Works';
  select id into s_nordic from public.suppliers where organization_id = demo_org and name = 'Nordic Power Systems';
  select id into s_sierra from public.suppliers where organization_id = demo_org and name = 'Sierra Optics Manufacturing';
  select id into s_atlas from public.suppliers where organization_id = demo_org and name = 'Atlas Logistics Components';

  ---------------------------------------------------------------------------
  -- 1. RISK EVENTS (25 events spread across last 90 days)
  ---------------------------------------------------------------------------

  -- Geopolitical events
  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'geopolitical', 5, 0.92, 'TW', 'Reuters Intelligence',
    now() - interval '3 days',
    'Elevated military activity detected in Taiwan Strait; US State Department issues travel advisory upgrade for semiconductor industry personnel.',
    '{"category": "military_tension", "affected_sectors": ["semiconductors", "electronics"]}'::jsonb)
  returning id into re_tw_strait;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'geopolitical', 4, 0.85, 'TW', 'Trade Policy Monitor',
    now() - interval '18 days',
    'New semiconductor export controls proposed by Taiwan legislature targeting advanced node chipsets. Could impact MCU-9000 supply pipeline within 60 days.',
    '{"category": "export_control", "proposed_effective_date": "2026-05-01"}'::jsonb)
  returning id into re_tw_export;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'geopolitical', 3, 0.78, 'TW', 'Geopolitical Risk Weekly',
    now() - interval '45 days',
    'Cross-strait diplomatic tensions escalate following contested airspace incursion. No immediate trade impact but long-term sourcing risk elevated.',
    '{"category": "diplomatic_tension"}'::jsonb)
  returning id into re_tw_power;

  -- Cyber events
  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'cyber', 5, 0.88, 'TW', 'Mandiant Threat Intelligence',
    now() - interval '7 days',
    'Ransomware campaign targeting East Asian semiconductor manufacturers detected. MicroCore subsidiary network flagged as potentially exposed. Incident response initiated.',
    '{"threat_actor": "APT41_affiliate", "attack_vector": "phishing", "systems_affected": ["ERP", "MES"]}'::jsonb)
  returning id into re_tw_cyber;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'cyber', 3, 0.72, 'US', 'CISA Alert Feed',
    now() - interval '30 days',
    'Critical vulnerability (CVE-2026-1847) disclosed in industrial control systems used across US logistics sector. Patch available but deployment lag expected.',
    '{"cve": "CVE-2026-1847", "cvss_score": 8.1}'::jsonb)
  returning id into re_us_cyber;

  -- Natural disaster events
  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'natural_disaster', 4, 0.90, 'MY', 'NOAA Weather Service',
    now() - interval '5 days',
    'Severe flooding reported in Penang industrial corridor following 72-hour monsoon rainfall. Multiple manufacturing zones experiencing power outages and road closures.',
    '{"event": "monsoon_flooding", "rainfall_mm": 340, "duration_hours": 72}'::jsonb)
  returning id into re_my_flood;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'natural_disaster', 4, 0.82, 'TW', 'Japan Meteorological Agency',
    now() - interval '12 days',
    'Typhoon Meiyu tracking toward northern Taiwan with sustained winds of 140 km/h. Hsinchu Science Park activates precautionary shutdown protocols.',
    '{"event": "typhoon", "name": "Meiyu", "category": 2, "wind_speed_kmh": 140}'::jsonb)
  returning id into re_tw_typhoon;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'natural_disaster', 3, 0.75, 'MX', 'USGS Earthquake Monitor',
    now() - interval '22 days',
    'Magnitude 5.2 earthquake recorded 85 km southwest of Monterrey. No structural damage reported at Sierra Optics facility; precautionary inspection ordered.',
    '{"event": "earthquake", "magnitude": 5.2, "depth_km": 12}'::jsonb)
  returning id into re_mx_quake;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'natural_disaster', 2, 0.68, 'MY', 'AccuWeather Pro',
    now() - interval '55 days',
    'Extended monsoon season forecast for Q1 2026 with above-average precipitation. Penang flood risk elevated through March. Advisory for logistics contingency planning.',
    '{"event": "seasonal_forecast", "risk_period": "Jan-Mar 2026"}'::jsonb)
  returning id into re_my_monsoon;

  -- Supply disruption events
  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'supply_disruption', 5, 0.95, 'TW', 'Industry Wire',
    now() - interval '2 days',
    'Fire reported at MicroCore Hsinchu Fab 3 clean room B. Production halted on MCU-9000 line. Estimated 4-6 week recovery. Alternative sourcing urgently needed.',
    '{"cause": "electrical_fire", "production_line": "MCU-9000", "estimated_downtime_weeks": 5}'::jsonb)
  returning id into re_tw_fab_fire;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'supply_disruption', 4, 0.87, null, 'S&P Global Commodity Insights',
    now() - interval '15 days',
    'Global semiconductor wafer shortage intensifies as 3 major silicon producers cut output by 12%. Lead times for advanced-node chips expected to extend by 3-4 weeks.',
    '{"commodity": "silicon_wafers", "supply_cut_pct": 12, "lead_time_impact_weeks": 3.5}'::jsonb)
  returning id into re_global_chip;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'supply_disruption', 3, 0.80, 'US', 'FreightWaves',
    now() - interval '25 days',
    'Port of Long Beach experiencing 8-day vessel queue due to labor action. West Coast import delays affecting inbound shipments from Asia-Pacific suppliers.',
    '{"port": "Long Beach", "delay_days": 8, "cause": "labor_action"}'::jsonb)
  returning id into re_us_port;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'supply_disruption', 3, 0.76, null, 'Drewry Maritime Research',
    now() - interval '35 days',
    'Global container shipping rates surge 45% month-over-month. Red Sea route diversions adding 10-14 days to Asia-Europe transit. Freight cost pressure building.',
    '{"rate_increase_pct": 45, "additional_transit_days": 12}'::jsonb)
  returning id into re_global_shipping;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'supply_disruption', 3, 0.74, 'MX', 'Supply Chain Dive',
    now() - interval '40 days',
    'Trucking disruptions on Monterrey-Laredo corridor due to security checkpoints. Average cross-border transit time increased from 6 to 14 hours.',
    '{"corridor": "Monterrey-Laredo", "delay_increase_hours": 8}'::jsonb)
  returning id into re_mx_logistics;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'supply_disruption', 2, 0.65, 'DE', 'DW Business',
    now() - interval '50 days',
    'Deutsche Bahn rail workers announce 48-hour warning strike affecting freight services across Bavaria. Minor delays expected for domestic transfers.',
    '{"cause": "labor_strike", "duration_hours": 48}'::jsonb)
  returning id into re_de_strike;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'supply_disruption', 2, 0.70, 'US', 'Railway Age',
    now() - interval '60 days',
    'Class I railroad service disruptions in Southwest US due to extreme heat warping tracks. Phoenix area shipments experiencing 2-3 day delays.',
    '{"cause": "heat_damage", "region": "Southwest US", "delay_days": 2.5}'::jsonb)
  returning id into re_us_rail;

  -- Quality events
  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'quality', 4, 0.88, 'MY', 'Internal QA Report',
    now() - interval '10 days',
    'Elevated defect rate (3.8%) detected in PCB batch PEN-2026-0312 from Pacific PCB Works. Batch quarantined pending root cause analysis. Possible solder contamination.',
    '{"batch_id": "PEN-2026-0312", "defect_rate_pct": 3.8, "defect_type": "solder_contamination"}'::jsonb)
  returning id into re_my_quality;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'quality', 3, 0.80, 'MX', 'Internal QA Report',
    now() - interval '28 days',
    'Sierra Optics display panels showing 2.1% higher-than-spec color temperature variance in latest shipment. Engineering review initiated; within tolerance but trending.',
    '{"spec_variance_pct": 2.1, "parameter": "color_temperature"}'::jsonb)
  returning id into re_mx_quality;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'quality', 3, 0.82, 'DE', 'RAPEX Safety Alert',
    now() - interval '65 days',
    'Industry-wide recall advisory for lithium cells manufactured with specific cathode batch. Nordic Power Bavaria facility uses affected material in 15% of production.',
    '{"recall_type": "precautionary", "affected_production_pct": 15}'::jsonb)
  returning id into re_de_recall;

  -- Regulatory events
  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'regulatory', 3, 0.85, 'DE', 'EU Official Journal',
    now() - interval '20 days',
    'EU Carbon Border Adjustment Mechanism Phase 2 enters force. New reporting obligations for imported electronic components. Compliance deadline: Q3 2026.',
    '{"regulation": "CBAM Phase 2", "compliance_deadline": "2026-09-30"}'::jsonb)
  returning id into re_de_reg;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'regulatory', 3, 0.80, 'DE', 'German Federal Network Agency',
    now() - interval '38 days',
    'German energy surcharge increase of 18% effective April 2026. Manufacturing electricity costs for Bavaria operations projected to rise by EUR 45K/quarter.',
    '{"surcharge_increase_pct": 18, "quarterly_impact_eur": 45000}'::jsonb)
  returning id into re_de_energy;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'regulatory', 4, 0.83, 'US', 'Federal Register',
    now() - interval '14 days',
    'New Section 301 tariffs announced: 25% duty on electronic components from select Asian origins. Atlas Logistics import costs for redistributed parts affected.',
    '{"tariff_rate_pct": 25, "effective_date": "2026-04-15"}'::jsonb)
  returning id into re_us_tariff;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'regulatory', 2, 0.70, 'MY', 'Malaysian Customs Gazette',
    now() - interval '48 days',
    'Malaysia introduces enhanced customs documentation requirements for electronics exports. Processing time expected to increase by 1-2 business days.',
    '{"requirement": "enhanced_documentation", "delay_days": 1.5}'::jsonb)
  returning id into re_my_customs;

  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'regulatory', 2, 0.68, 'MX', 'SEMARNAT',
    now() - interval '70 days',
    'Updated Mexican environmental compliance standards for manufacturing facilities. Sierra Optics plant requires air quality monitoring system upgrade by Q4 2026.',
    '{"regulation": "NOM-085-SEMARNAT", "compliance_deadline": "2026-12-31"}'::jsonb)
  returning id into re_mx_env;

  -- Security/regional event
  insert into public.risk_events (organization_id, event_type, severity, confidence, region_code, source_name, observed_at, summary, payload)
  values (demo_org, 'geopolitical', 2, 0.65, 'MX', 'Control Risks',
    now() - interval '42 days',
    'Increased organized crime activity reported along Monterrey industrial corridor. No direct incidents at supplier facilities; enhanced security advisory issued.',
    '{"advisory_level": "elevated", "area": "Monterrey industrial corridor"}'::jsonb)
  returning id into re_mx_cartel;

  ---------------------------------------------------------------------------
  -- 2. RISK EVENT ↔ SUPPLIER LINKS
  ---------------------------------------------------------------------------

  insert into public.risk_event_suppliers (risk_event_id, supplier_id, organization_id, impact_level)
  values
    -- MicroCore (TW) - high impact from geopolitical and supply events
    (re_tw_strait, s_microcore, demo_org, 5),
    (re_tw_export, s_microcore, demo_org, 4),
    (re_tw_cyber, s_microcore, demo_org, 5),
    (re_tw_typhoon, s_microcore, demo_org, 4),
    (re_tw_fab_fire, s_microcore, demo_org, 5),
    (re_global_chip, s_microcore, demo_org, 4),
    (re_tw_power, s_microcore, demo_org, 3),
    -- Pacific PCB (MY)
    (re_my_flood, s_pacific, demo_org, 4),
    (re_my_quality, s_pacific, demo_org, 4),
    (re_my_monsoon, s_pacific, demo_org, 2),
    (re_my_customs, s_pacific, demo_org, 2),
    -- Nordic Power (DE)
    (re_de_reg, s_nordic, demo_org, 3),
    (re_de_energy, s_nordic, demo_org, 3),
    (re_de_strike, s_nordic, demo_org, 2),
    (re_de_recall, s_nordic, demo_org, 3),
    -- Sierra Optics (MX)
    (re_mx_quake, s_sierra, demo_org, 3),
    (re_mx_quality, s_sierra, demo_org, 3),
    (re_mx_logistics, s_sierra, demo_org, 3),
    (re_mx_cartel, s_sierra, demo_org, 2),
    (re_mx_env, s_sierra, demo_org, 2),
    -- Atlas Logistics (US)
    (re_us_tariff, s_atlas, demo_org, 4),
    (re_us_port, s_atlas, demo_org, 3),
    (re_us_cyber, s_atlas, demo_org, 3),
    (re_us_rail, s_atlas, demo_org, 2),
    -- Cross-supplier impact
    (re_global_shipping, s_pacific, demo_org, 3),
    (re_global_shipping, s_microcore, demo_org, 3),
    (re_global_chip, s_pacific, demo_org, 2)
  on conflict (risk_event_id, supplier_id) do nothing;

  ---------------------------------------------------------------------------
  -- 3. SUPPLIER RISK SCORES
  ---------------------------------------------------------------------------

  insert into public.supplier_risk_scores (organization_id, supplier_id, score, trend, explanation, scored_at)
  values
    (demo_org, s_microcore, 78.50, 'up',
     '{"eventCount": 7, "topFactors": ["Taiwan Strait military tensions (S5)", "Fab 3 fire halting MCU-9000 production (S5)", "Ransomware campaign targeting subsidiary (S5)"], "trendReason": "Multiple concurrent high-severity events in last 30 days"}'::jsonb,
     now() - interval '1 hour'),
    (demo_org, s_pacific, 52.30, 'flat',
     '{"eventCount": 5, "topFactors": ["Penang flooding disruption (S4)", "PCB quality defect batch quarantine (S4)", "Monsoon season logistics risk (S2)"], "trendReason": "Seasonal risk factors within historical norms"}'::jsonb,
     now() - interval '1 hour'),
    (demo_org, s_nordic, 35.00, 'down',
     '{"eventCount": 4, "topFactors": ["EU CBAM compliance obligations (S3)", "Energy surcharge cost increase (S3)", "Battery recall advisory (S3)"], "trendReason": "Regulatory risks manageable; strong operational performance trending positively"}'::jsonb,
     now() - interval '1 hour'),
    (demo_org, s_sierra, 68.75, 'up',
     '{"eventCount": 5, "topFactors": ["Display panel quality variance (S3)", "Monterrey earthquake proximity (S3)", "Trucking corridor security delays (S3)"], "trendReason": "Declining financial health (BB rating) compounds operational risk exposure"}'::jsonb,
     now() - interval '1 hour'),
    (demo_org, s_atlas, 45.20, 'flat',
     '{"eventCount": 4, "topFactors": ["Section 301 tariff impact (S4)", "Port of Long Beach congestion (S3)", "ICS vulnerability exposure (S3)"], "trendReason": "Domestic supplier with moderate trade policy exposure; stable overall"}'::jsonb,
     now() - interval '1 hour')
  on conflict (supplier_id) do update
    set score = excluded.score,
        trend = excluded.trend,
        explanation = excluded.explanation,
        scored_at = excluded.scored_at;

  ---------------------------------------------------------------------------
  -- 4. ALERTS (20 alerts across all statuses and severities)
  ---------------------------------------------------------------------------

  -- OPEN alerts (7) — show urgency
  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, created_at)
  values (demo_org, s_microcore, re_tw_fab_fire, 'CRITICAL: MicroCore Fab 3 production halt — MCU-9000 line down', 5, 'open', now() - interval '2 days')
  returning id into a1;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, created_at)
  values (demo_org, s_microcore, re_tw_cyber, 'Ransomware threat targeting MicroCore subsidiary network', 5, 'open', now() - interval '7 days')
  returning id into a2;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, created_at)
  values (demo_org, s_microcore, re_tw_strait, 'Geopolitical risk escalation: Taiwan Strait military activity', 5, 'open', now() - interval '3 days')
  returning id into a3;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, created_at)
  values (demo_org, s_pacific, re_my_flood, 'Penang facility flooding — production disruption imminent', 4, 'open', now() - interval '5 days')
  returning id into a4;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, created_at)
  values (demo_org, s_pacific, re_my_quality, 'Quality alert: PCB batch PEN-2026-0312 quarantined', 4, 'open', now() - interval '10 days')
  returning id into a5;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, created_at)
  values (demo_org, s_atlas, re_us_tariff, 'New 25% Section 301 tariff affecting component imports', 4, 'open', now() - interval '14 days')
  returning id into a6;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, created_at)
  values (demo_org, s_sierra, re_mx_quality, 'Display panel color temperature variance exceeding trend limits', 3, 'open', now() - interval '28 days')
  returning id into a7;

  -- ACKNOWLEDGED alerts (6) — show active investigation
  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, created_at)
  values (demo_org, s_microcore, re_tw_export, 'Taiwan export control proposal may restrict MCU-9000 supply', 4, 'acknowledged', demo_user, now() - interval '16 days', now() - interval '18 days')
  returning id into a8;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, created_at)
  values (demo_org, s_microcore, re_tw_typhoon, 'Typhoon Meiyu approaching Hsinchu — precautionary shutdown', 4, 'acknowledged', demo_user, now() - interval '11 days', now() - interval '12 days')
  returning id into a9;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, created_at)
  values (demo_org, s_atlas, re_us_port, 'Port of Long Beach congestion — 8-day vessel queue', 3, 'acknowledged', demo_user, now() - interval '23 days', now() - interval '25 days')
  returning id into a10;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, created_at)
  values (demo_org, s_sierra, re_mx_logistics, 'Monterrey-Laredo trucking delays — transit time doubled', 3, 'acknowledged', demo_user, now() - interval '38 days', now() - interval '40 days')
  returning id into a11;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, created_at)
  values (demo_org, s_nordic, re_de_reg, 'EU CBAM Phase 2 compliance deadline approaching', 3, 'acknowledged', demo_user, now() - interval '18 days', now() - interval '20 days')
  returning id into a12;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, created_at)
  values (demo_org, s_atlas, re_us_cyber, 'ICS vulnerability CVE-2026-1847 — patch deployment needed', 3, 'acknowledged', demo_user, now() - interval '28 days', now() - interval '30 days')
  returning id into a13;

  -- RESOLVED alerts (7) — show capability to handle issues
  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, resolved_by, resolved_at, resolution_note, created_at)
  values (demo_org, s_microcore, re_global_chip, 'Global wafer shortage — lead time extension for advanced nodes', 4, 'resolved',
    demo_user, now() - interval '13 days', demo_user, now() - interval '8 days',
    'Secured allocation commitment from MicroCore for Q2. Activated secondary source qualification.',
    now() - interval '15 days')
  returning id into a14;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, resolved_by, resolved_at, resolution_note, created_at)
  values (demo_org, s_nordic, re_de_energy, 'German energy surcharge increase impacting Bavaria operations', 3, 'resolved',
    demo_user, now() - interval '35 days', demo_user, now() - interval '25 days',
    'Cost increase absorbed in Q2 budget. Long-term energy contract renegotiation initiated.',
    now() - interval '38 days')
  returning id into a15;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, resolved_by, resolved_at, resolution_note, created_at)
  values (demo_org, s_nordic, re_de_recall, 'Battery cell precautionary recall — cathode batch review', 3, 'resolved',
    demo_user, now() - interval '60 days', demo_user, now() - interval '45 days',
    'Affected production isolated to 15% of output. All shipped units verified safe. Process controls updated.',
    now() - interval '65 days')
  returning id into a16;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, resolved_by, resolved_at, resolution_note, created_at)
  values (demo_org, s_nordic, re_de_strike, 'Bavaria rail freight strike — 48-hour service disruption', 2, 'resolved',
    demo_user, now() - interval '48 days', demo_user, now() - interval '46 days',
    'Strike concluded after 48 hours. Backlogged shipments cleared within 3 days. No material impact.',
    now() - interval '50 days')
  returning id into a17;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, resolved_by, resolved_at, resolution_note, created_at)
  values (demo_org, s_pacific, re_my_customs, 'Malaysia enhanced customs documentation — processing delays', 2, 'resolved',
    demo_user, now() - interval '45 days', demo_user, now() - interval '40 days',
    'Updated export documentation templates deployed. Processing time normalized.',
    now() - interval '48 days')
  returning id into a18;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, resolved_by, resolved_at, resolution_note, created_at)
  values (demo_org, s_atlas, re_us_rail, 'Southwest US rail heat damage — Phoenix shipment delays', 2, 'resolved',
    demo_user, now() - interval '58 days', demo_user, now() - interval '52 days',
    'Rerouted critical shipments to trucking. Rail service restored after track repairs.',
    now() - interval '60 days')
  returning id into a19;

  insert into public.alerts (organization_id, supplier_id, risk_event_id, title, severity, status, acknowledged_by, acknowledged_at, resolved_by, resolved_at, resolution_note, created_at)
  values (demo_org, s_sierra, re_mx_env, 'Mexican environmental compliance upgrade required', 2, 'resolved',
    demo_user, now() - interval '68 days', demo_user, now() - interval '55 days',
    'Air quality monitoring system RFP issued. Vendor selected; installation scheduled for Q3.',
    now() - interval '70 days')
  returning id into a20;

  ---------------------------------------------------------------------------
  -- 5. ALERT EVENTS (audit trail)
  ---------------------------------------------------------------------------

  -- All alerts get a 'generated' event
  insert into public.alert_events (alert_id, organization_id, event_type, payload, created_at)
  values
    (a1, demo_org, 'generated', '{"source": "risk_engine", "trigger": "severity_5_event"}'::jsonb, now() - interval '2 days'),
    (a2, demo_org, 'generated', '{"source": "risk_engine", "trigger": "cyber_threat_detected"}'::jsonb, now() - interval '7 days'),
    (a3, demo_org, 'generated', '{"source": "risk_engine", "trigger": "geopolitical_escalation"}'::jsonb, now() - interval '3 days'),
    (a4, demo_org, 'generated', '{"source": "risk_engine", "trigger": "natural_disaster_proximity"}'::jsonb, now() - interval '5 days'),
    (a5, demo_org, 'generated', '{"source": "risk_engine", "trigger": "quality_threshold_breach"}'::jsonb, now() - interval '10 days'),
    (a6, demo_org, 'generated', '{"source": "risk_engine", "trigger": "regulatory_change"}'::jsonb, now() - interval '14 days'),
    (a7, demo_org, 'generated', '{"source": "risk_engine", "trigger": "quality_trend_alert"}'::jsonb, now() - interval '28 days'),
    (a8, demo_org, 'generated', '{"source": "risk_engine", "trigger": "regulatory_change"}'::jsonb, now() - interval '18 days'),
    (a9, demo_org, 'generated', '{"source": "risk_engine", "trigger": "weather_tracking"}'::jsonb, now() - interval '12 days'),
    (a10, demo_org, 'generated', '{"source": "risk_engine", "trigger": "logistics_disruption"}'::jsonb, now() - interval '25 days'),
    (a11, demo_org, 'generated', '{"source": "risk_engine", "trigger": "logistics_disruption"}'::jsonb, now() - interval '40 days'),
    (a12, demo_org, 'generated', '{"source": "risk_engine", "trigger": "compliance_deadline"}'::jsonb, now() - interval '20 days'),
    (a13, demo_org, 'generated', '{"source": "risk_engine", "trigger": "vulnerability_disclosure"}'::jsonb, now() - interval '30 days'),
    (a14, demo_org, 'generated', '{"source": "risk_engine", "trigger": "supply_shortage"}'::jsonb, now() - interval '15 days'),
    (a15, demo_org, 'generated', '{"source": "risk_engine", "trigger": "cost_impact"}'::jsonb, now() - interval '38 days'),
    (a16, demo_org, 'generated', '{"source": "risk_engine", "trigger": "recall_advisory"}'::jsonb, now() - interval '65 days'),
    (a17, demo_org, 'generated', '{"source": "risk_engine", "trigger": "logistics_disruption"}'::jsonb, now() - interval '50 days'),
    (a18, demo_org, 'generated', '{"source": "risk_engine", "trigger": "regulatory_change"}'::jsonb, now() - interval '48 days'),
    (a19, demo_org, 'generated', '{"source": "risk_engine", "trigger": "logistics_disruption"}'::jsonb, now() - interval '60 days'),
    (a20, demo_org, 'generated', '{"source": "risk_engine", "trigger": "compliance_requirement"}'::jsonb, now() - interval '70 days');

  -- Escalation events for critical alerts
  insert into public.alert_events (alert_id, organization_id, event_type, payload, created_at)
  values
    (a1, demo_org, 'escalated', '{"reason": "severity_5_production_halt", "escalated_to": "VP Supply Chain"}'::jsonb, now() - interval '2 days' + interval '30 minutes'),
    (a2, demo_org, 'escalated', '{"reason": "cyber_threat_active", "escalated_to": "CISO"}'::jsonb, now() - interval '7 days' + interval '15 minutes'),
    (a3, demo_org, 'escalated', '{"reason": "geopolitical_severity_5", "escalated_to": "Chief Risk Officer"}'::jsonb, now() - interval '3 days' + interval '1 hour');

  -- Acknowledged events
  insert into public.alert_events (alert_id, organization_id, event_type, actor_id, created_at)
  values
    (a8, demo_org, 'acknowledged', demo_user, now() - interval '16 days'),
    (a9, demo_org, 'acknowledged', demo_user, now() - interval '11 days'),
    (a10, demo_org, 'acknowledged', demo_user, now() - interval '23 days'),
    (a11, demo_org, 'acknowledged', demo_user, now() - interval '38 days'),
    (a12, demo_org, 'acknowledged', demo_user, now() - interval '18 days'),
    (a13, demo_org, 'acknowledged', demo_user, now() - interval '28 days'),
    -- Resolved alerts were also acknowledged first
    (a14, demo_org, 'acknowledged', demo_user, now() - interval '13 days'),
    (a15, demo_org, 'acknowledged', demo_user, now() - interval '35 days'),
    (a16, demo_org, 'acknowledged', demo_user, now() - interval '60 days'),
    (a17, demo_org, 'acknowledged', demo_user, now() - interval '48 days'),
    (a18, demo_org, 'acknowledged', demo_user, now() - interval '45 days'),
    (a19, demo_org, 'acknowledged', demo_user, now() - interval '58 days'),
    (a20, demo_org, 'acknowledged', demo_user, now() - interval '68 days');

  -- Resolved events
  insert into public.alert_events (alert_id, organization_id, event_type, actor_id, payload, created_at)
  values
    (a14, demo_org, 'resolved', demo_user, '{"resolution": "secondary_source_activated"}'::jsonb, now() - interval '8 days'),
    (a15, demo_org, 'resolved', demo_user, '{"resolution": "budget_absorbed"}'::jsonb, now() - interval '25 days'),
    (a16, demo_org, 'resolved', demo_user, '{"resolution": "affected_units_verified"}'::jsonb, now() - interval '45 days'),
    (a17, demo_org, 'resolved', demo_user, '{"resolution": "strike_concluded"}'::jsonb, now() - interval '46 days'),
    (a18, demo_org, 'resolved', demo_user, '{"resolution": "documentation_updated"}'::jsonb, now() - interval '40 days'),
    (a19, demo_org, 'resolved', demo_user, '{"resolution": "service_restored"}'::jsonb, now() - interval '52 days'),
    (a20, demo_org, 'resolved', demo_user, '{"resolution": "vendor_selected"}'::jsonb, now() - interval '55 days');

  ---------------------------------------------------------------------------
  -- 6. INCIDENTS (10 incidents across all statuses)
  ---------------------------------------------------------------------------

  -- OPEN incidents (3)
  insert into public.incidents (organization_id, alert_id, title, status, started_at)
  values (demo_org, a1, 'MicroCore Fab 3 Fire — Critical MCU Supply Disruption', 'open', now() - interval '2 days')
  returning id into inc1;

  insert into public.incidents (organization_id, alert_id, title, status, started_at)
  values (demo_org, a3, 'Taiwan Strait Geopolitical Escalation — Contingency Activation', 'open', now() - interval '3 days')
  returning id into inc2;

  insert into public.incidents (organization_id, alert_id, title, status, started_at)
  values (demo_org, a4, 'Penang Monsoon Flooding — Pacific PCB Facility Impact', 'open', now() - interval '5 days')
  returning id into inc3;

  -- IN_PROGRESS incidents (4)
  insert into public.incidents (organization_id, alert_id, title, status, owner_id, started_at)
  values (demo_org, a2, 'Cybersecurity Incident Response — MicroCore Ransomware Threat', 'in_progress', demo_user, now() - interval '7 days')
  returning id into inc4;

  insert into public.incidents (organization_id, alert_id, title, status, owner_id, started_at)
  values (demo_org, a5, 'PCB Quality Investigation — Solder Contamination Root Cause', 'in_progress', demo_user, now() - interval '10 days')
  returning id into inc5;

  insert into public.incidents (organization_id, alert_id, title, status, owner_id, started_at)
  values (demo_org, a6, 'Section 301 Tariff Impact Assessment and Mitigation', 'in_progress', demo_user, now() - interval '14 days')
  returning id into inc6;

  insert into public.incidents (organization_id, alert_id, title, status, owner_id, started_at)
  values (demo_org, a10, 'Port Congestion Response — Asia-Pacific Shipment Rerouting', 'in_progress', demo_user, now() - interval '25 days')
  returning id into inc7;

  -- CLOSED incidents (3)
  insert into public.incidents (organization_id, alert_id, title, status, owner_id, started_at, closed_at)
  values (demo_org, a14, 'Wafer Shortage Allocation — Secondary Source Qualification', 'closed', demo_user, now() - interval '15 days', now() - interval '8 days')
  returning id into inc8;

  insert into public.incidents (organization_id, alert_id, title, status, owner_id, started_at, closed_at)
  values (demo_org, a16, 'Battery Cell Recall Assessment — Nordic Power Bavaria', 'closed', demo_user, now() - interval '65 days', now() - interval '45 days')
  returning id into inc9;

  insert into public.incidents (organization_id, alert_id, title, status, owner_id, started_at, closed_at)
  values (demo_org, a19, 'Southwest Rail Disruption — Phoenix Logistics Recovery', 'closed', demo_user, now() - interval '60 days', now() - interval '52 days')
  returning id into inc10;

  ---------------------------------------------------------------------------
  -- 7. INCIDENT ACTIONS
  ---------------------------------------------------------------------------

  -- inc1 (Open - Fab fire): initial triage actions
  insert into public.incident_actions (incident_id, organization_id, action_title, status, due_at)
  values
    (inc1, demo_org, 'Confirm extent of fire damage to Fab 3 clean room B', 'doing', now() + interval '1 day'),
    (inc1, demo_org, 'Contact MicroCore emergency operations center for status', 'done', now() - interval '1 day'),
    (inc1, demo_org, 'Activate dual-source strategy with qualified JP/KR supplier', 'todo', now() + interval '3 days'),
    (inc1, demo_org, 'Assess MCU-9000 safety stock runway and customer commitments', 'todo', now() + interval '2 days');

  -- inc4 (In Progress - Cyber): active response
  insert into public.incident_actions (incident_id, organization_id, action_title, owner_id, status, due_at)
  values
    (inc4, demo_org, 'Isolate affected MicroCore subsidiary network segments', demo_user, 'done', now() - interval '6 days'),
    (inc4, demo_org, 'Deploy IOC signatures to perimeter defenses', demo_user, 'done', now() - interval '5 days'),
    (inc4, demo_org, 'Conduct forensic analysis of compromised endpoints', demo_user, 'doing', now() - interval '2 days'),
    (inc4, demo_org, 'Verify ERP/MES data integrity post-incident', demo_user, 'todo', now() + interval '3 days'),
    (inc4, demo_org, 'Issue supplier security questionnaire update', demo_user, 'todo', now() + interval '7 days');

  -- inc5 (In Progress - Quality): investigation actions
  insert into public.incident_actions (incident_id, organization_id, action_title, owner_id, status, due_at)
  values
    (inc5, demo_org, 'Quarantine PCB batch PEN-2026-0312 at receiving dock', demo_user, 'done', now() - interval '9 days'),
    (inc5, demo_org, 'Send defective samples to independent lab for analysis', demo_user, 'done', now() - interval '8 days'),
    (inc5, demo_org, 'Root cause analysis: solder paste composition testing', demo_user, 'doing', now() - interval '3 days'),
    (inc5, demo_org, 'Review Pacific PCB supplier corrective action plan', demo_user, 'blocked', now() + interval '5 days');

  -- inc6 (In Progress - Tariff): assessment actions
  insert into public.incident_actions (incident_id, organization_id, action_title, owner_id, status, due_at)
  values
    (inc6, demo_org, 'Map affected SKUs and calculate tariff cost exposure', demo_user, 'done', now() - interval '10 days'),
    (inc6, demo_org, 'Evaluate tariff engineering opportunities (HTS reclassification)', demo_user, 'doing', now() + interval '5 days'),
    (inc6, demo_org, 'Model domestic sourcing alternatives for top-5 impacted parts', demo_user, 'todo', now() + interval '14 days'),
    (inc6, demo_org, 'Brief executive team on cost impact and mitigation options', demo_user, 'todo', now() + interval '7 days');

  -- inc7 (In Progress - Port congestion): logistics response
  insert into public.incident_actions (incident_id, organization_id, action_title, owner_id, status, due_at)
  values
    (inc7, demo_org, 'Identify critical shipments in Long Beach queue', demo_user, 'done', now() - interval '23 days'),
    (inc7, demo_org, 'Divert priority containers to Port of Oakland', demo_user, 'done', now() - interval '20 days'),
    (inc7, demo_org, 'Negotiate expedited customs clearance for diverted shipments', demo_user, 'doing', now() - interval '15 days'),
    (inc7, demo_org, 'Monitor queue resolution and normalize routing', demo_user, 'doing', now() + interval '5 days');

  -- inc8 (Closed - Wafer shortage): completed actions
  insert into public.incident_actions (incident_id, organization_id, action_title, owner_id, status, due_at)
  values
    (inc8, demo_org, 'Secure Q2 allocation commitment from MicroCore', demo_user, 'done', now() - interval '12 days'),
    (inc8, demo_org, 'Fast-track qualification of SemiTech KR as backup source', demo_user, 'done', now() - interval '10 days'),
    (inc8, demo_org, 'Update demand forecast models with extended lead times', demo_user, 'done', now() - interval '9 days');

  -- inc9 (Closed - Battery recall): completed actions
  insert into public.incident_actions (incident_id, organization_id, action_title, owner_id, status, due_at)
  values
    (inc9, demo_org, 'Identify all shipped units containing affected cathode batch', demo_user, 'done', now() - interval '62 days'),
    (inc9, demo_org, 'Conduct accelerated lifecycle testing on affected cells', demo_user, 'done', now() - interval '55 days'),
    (inc9, demo_org, 'Verify all units within safety parameters — no field recall needed', demo_user, 'done', now() - interval '48 days'),
    (inc9, demo_org, 'Update incoming inspection protocol for cathode materials', demo_user, 'done', now() - interval '46 days');

  -- inc10 (Closed - Rail disruption): completed actions
  insert into public.incident_actions (incident_id, organization_id, action_title, owner_id, status, due_at)
  values
    (inc10, demo_org, 'Reroute Phoenix-bound shipments to trucking carriers', demo_user, 'done', now() - interval '58 days'),
    (inc10, demo_org, 'Track rail service restoration timeline', demo_user, 'done', now() - interval '54 days'),
    (inc10, demo_org, 'Resume rail routing after track repair verification', demo_user, 'done', now() - interval '52 days');

  raise notice 'Phase 3 seed data applied successfully for org %', demo_org;
end
$$;
