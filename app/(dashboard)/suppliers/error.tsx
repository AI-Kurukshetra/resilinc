"use client";

import { RouteError } from "@/app/(dashboard)/_components/route-error";

interface SuppliersErrorProps {
  error: Error;
  reset: () => void;
}

export default function SuppliersError({ error, reset }: SuppliersErrorProps) {
  return (
    <RouteError
      title="Suppliers View Failed"
      message={error.message || "Could not render supplier data."}
      reset={reset}
    />
  );
}
