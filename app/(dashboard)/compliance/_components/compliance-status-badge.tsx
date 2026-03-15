import { cn } from "@/lib/utils";
import type { ComplianceItemStatus } from "@/lib/validations/compliance";

interface Props {
  status: ComplianceItemStatus;
}

const STATUS_STYLES: Record<ComplianceItemStatus, string> = {
  compliant: "bg-emerald-100 text-emerald-800",
  non_compliant: "bg-rose-100 text-rose-800",
  partially_compliant: "bg-amber-100 text-amber-800",
  not_assessed: "bg-slate-100 text-slate-600",
  exempted: "bg-blue-100 text-blue-800",
};

const STATUS_LABEL: Record<ComplianceItemStatus, string> = {
  compliant: "Compliant",
  non_compliant: "Non-compliant",
  partially_compliant: "Partial",
  not_assessed: "Not assessed",
  exempted: "Exempted",
};

export function ComplianceStatusBadge({ status }: Props) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
