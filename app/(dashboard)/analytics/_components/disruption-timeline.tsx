"use client";

interface DisruptionEvent {
  id: string;
  event_type: string;
  severity: number;
  observed_at: string;
  summary: string;
  region_code: string | null;
}

interface DisruptionTimelineProps {
  events: DisruptionEvent[];
}

function severityLabel(severity: number): string {
  switch (severity) {
    case 5: return "Critical";
    case 4: return "High";
    case 3: return "Medium";
    case 2: return "Low";
    default: return "Info";
  }
}

function severityBadgeClass(severity: number): string {
  switch (severity) {
    case 5: return "bg-red-100 text-red-800";
    case 4: return "bg-orange-100 text-orange-800";
    case 3: return "bg-yellow-100 text-yellow-800";
    case 2: return "bg-blue-100 text-blue-800";
    default: return "bg-slate-100 text-slate-700";
  }
}

export function DisruptionTimeline({ events }: DisruptionTimelineProps) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-600">No recent disruption events to display.</p>;
  }

  return (
    <ul className="max-h-[500px] space-y-2 overflow-y-auto">
      {events.map((event) => (
        <li
          key={event.id}
          className="rounded-lg border border-slate-200 p-3 text-sm transition hover:bg-slate-50"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityBadgeClass(event.severity)}`}>
                S{event.severity} {severityLabel(event.severity)}
              </span>
              <span className="text-xs font-medium text-slate-700">{event.event_type}</span>
            </div>
            <span className="text-xs text-slate-500">
              {new Date(event.observed_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <p className="mt-1 text-slate-700">{event.summary}</p>
          {event.region_code && (
            <p className="mt-1 text-xs text-slate-500">Region: {event.region_code}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
