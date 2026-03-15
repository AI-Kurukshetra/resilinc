"use client";

import { RouteError } from "@/app/(dashboard)/_components/route-error";

interface SupplierDetailErrorProps {
  error: Error;
  reset: () => void;
}

export default function SupplierDetailError({ error, reset }: SupplierDetailErrorProps) {
  return (
    <RouteError
      title="Supplier Detail Failed"
      message={error.message || "Could not load supplier detail view."}
      reset={reset}
    />
  );
}
