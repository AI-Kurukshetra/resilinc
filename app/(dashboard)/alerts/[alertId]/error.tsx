"use client";

import { RouteError } from "@/app/(dashboard)/_components/route-error";

interface AlertDetailErrorProps {
  error: Error;
  reset: () => void;
}

export default function AlertDetailError({ error, reset }: AlertDetailErrorProps) {
  return (
    <RouteError
      title="Alert Detail Failed"
      message={error.message || "Could not load alert detail view."}
      reset={reset}
    />
  );
}
