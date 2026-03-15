import { cn } from "@/lib/utils";

interface AlertStatusBadgeProps {
  status: "open" | "acknowledged" | "resolved";
}

export function AlertStatusBadge({ status }: AlertStatusBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        status === "open" && "bg-rose-100 text-rose-800",
        status === "acknowledged" && "bg-amber-100 text-amber-800",
        status === "resolved" && "bg-emerald-100 text-emerald-800",
      )}
    >
      {status}
    </span>
  );
}
