"use client";

import { useEffect } from "react";
import { RouteError } from "@/app/(dashboard)/_components/route-error";

interface OverviewErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OverviewError({ error, reset }: OverviewErrorProps) {
  useEffect(() => {
    console.error("Overview route error", error);
  }, [error]);

  return (
    <RouteError
      title="Overview failed to load"
      message={error.message || "Unexpected error while loading overview dashboard."}
      reset={reset}
    />
  );
}
