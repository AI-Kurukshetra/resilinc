import { cn } from "@/lib/utils";

interface IncidentStatusBadgeProps {
  status: "open" | "in_progress" | "closed";
}

export function IncidentStatusBadge({ status }: IncidentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        status === "open" && "bg-rose-100 text-rose-800",
        status === "in_progress" && "bg-amber-100 text-amber-800",
        status === "closed" && "bg-emerald-100 text-emerald-800",
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
