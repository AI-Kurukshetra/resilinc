"use client";

import { RouteError } from "@/app/(dashboard)/_components/route-error";

interface IncidentsErrorProps {
  error: Error;
  reset: () => void;
}

export default function IncidentsError({ error, reset }: IncidentsErrorProps) {
  return (
    <RouteError
      title="Incident Board Failed"
      message={error.message || "Could not render incident board."}
      reset={reset}
    />
  );
}
