"use client";

import { RouteError } from "@/app/(dashboard)/_components/route-error";

interface AnalyticsErrorProps {
  error: Error;
  reset: () => void;
}

export default function AnalyticsError({ error, reset }: AnalyticsErrorProps) {
  return (
    <RouteError
      title="Analytics View Failed"
      message={error.message || "Could not render analytics data."}
      reset={reset}
    />
  );
}
