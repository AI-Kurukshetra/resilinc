export interface PlaybookActionTemplate {
  dueInHours: number;
  title: string;
}

export interface GeneratedPlaybookAction {
  actionTitle: string;
  dueAt: string;
}

const SEVERITY_5_TEMPLATES: PlaybookActionTemplate[] = [
  { dueInHours: 2, title: "Activate incident command and communications bridge" },
  { dueInHours: 6, title: "Assess impacted suppliers, facilities, and critical parts" },
  { dueInHours: 12, title: "Execute mitigation and alternate sourcing workflow" },
  { dueInHours: 24, title: "Publish recovery status and revised supply plan" },
];

const SEVERITY_4_TEMPLATES: PlaybookActionTemplate[] = [
  { dueInHours: 6, title: "Assign owner and confirm supplier disruption scope" },
  { dueInHours: 12, title: "Validate inventory impact and buffer coverage" },
  { dueInHours: 24, title: "Coordinate procurement mitigation actions" },
  { dueInHours: 36, title: "Issue stakeholder update and next checkpoint" },
];

function addHours(baseIso: string, hours: number): string {
  const next = new Date(baseIso);
  next.setHours(next.getHours() + hours);
  return next.toISOString();
}

export function getPlaybookTemplatesForSeverity(severity: number): PlaybookActionTemplate[] {
  if (severity >= 5) {
    return SEVERITY_5_TEMPLATES;
  }

  return SEVERITY_4_TEMPLATES;
}

export function buildPlaybookActions(
  severity: number,
  baseTimeIso: string,
): GeneratedPlaybookAction[] {
  const templates = getPlaybookTemplatesForSeverity(severity);

  return templates.map((template) => ({
    actionTitle: template.title,
    dueAt: addHours(baseTimeIso, template.dueInHours),
  }));
}
