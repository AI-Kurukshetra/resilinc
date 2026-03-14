# MCP Integration Plan

## MCP Tool: `web.search_query`
- Purpose: discover disruption news for supplier regions and logistics corridors.
- Agent call pattern: execution-agent queries by supplier name + region + disruption keywords.
- Expected output: source URL, headline, date, extracted summary, confidence score.

## MCP Tool: `web.open` + `web.find`
- Purpose: validate and extract relevant evidence from identified sources.
- Agent call pattern: open top source URLs; find event phrases, dates, and entities.
- Expected output: verifiable event snippets and traceable references.

## MCP Tool: `web.weather`
- Purpose: enrich natural disaster and severe weather signals.
- Agent call pattern: map facility coordinates/locations to weather lookups.
- Expected output: severity indicators and forecast windows linked to facilities.

## MCP Tool: `read_mcp_resource` (future)
- Purpose: query internal connectors (ERP, vendor master, compliance data).
- Agent call pattern: read organization-specific resource URIs.
- Expected output: structured records for supplier enrichment and validation.

## Standardized Enrichment Payload

```json
{
  "source_type": "news|weather|internal",
  "source_url": "https://...",
  "observed_at": "2026-03-14T00:00:00Z",
  "event_type": "port_delay|flood|strike|sanction",
  "affected_regions": ["IN-GJ"],
  "affected_suppliers": ["uuid"],
  "severity": 4,
  "confidence": 0.78,
  "summary": "..."
}
```
