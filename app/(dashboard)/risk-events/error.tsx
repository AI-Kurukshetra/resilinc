"use client";

import { useEffect } from "react";
import { RouteError } from "@/app/(dashboard)/_components/route-error";

interface RiskEventsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RiskEventsError({ error, reset }: RiskEventsErrorProps) {
  useEffect(() => {
    console.error("Risk events route error", error);
  }, [error]);

  return (
    <RouteError
      title="Risk events unavailable"
      message={error.message || "Unexpected error while loading risk event workspace."}
      reset={reset}
    />
  );
}
