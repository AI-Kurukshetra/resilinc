"use client";

import { RouteError } from "@/app/(dashboard)/_components/route-error";

interface AlertsErrorProps {
  error: Error;
  reset: () => void;
}

export default function AlertsError({ error, reset }: AlertsErrorProps) {
  return (
    <RouteError
      title="Alerts View Failed"
      message={error.message || "Could not render alert feed."}
      reset={reset}
    />
  );
}
