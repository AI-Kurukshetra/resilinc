"use client";

import { RouteError } from "@/app/(dashboard)/_components/route-error";

interface ReportsErrorProps {
  error: Error;
  reset: () => void;
}

export default function ReportsError({ error, reset }: ReportsErrorProps) {
  return (
    <RouteError
      title="Report Summary Failed"
      message={error.message || "Could not render report summary."}
      reset={reset}
    />
  );
}
