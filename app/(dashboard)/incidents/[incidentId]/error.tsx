"use client";

import { RouteError } from "@/app/(dashboard)/_components/route-error";

interface IncidentDetailErrorProps {
  error: Error;
  reset: () => void;
}

export default function IncidentDetailError({ error, reset }: IncidentDetailErrorProps) {
  return (
    <RouteError
      title="Incident Detail Failed"
      message={error.message || "Could not render incident detail view."}
      reset={reset}
    />
  );
}
