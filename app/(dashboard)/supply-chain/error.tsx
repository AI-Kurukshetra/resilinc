"use client";

import { RouteError } from "@/app/(dashboard)/_components/route-error";

interface SupplyChainErrorProps {
  error: Error;
  reset: () => void;
}

export default function SupplyChainError({ error, reset }: SupplyChainErrorProps) {
  return (
    <RouteError
      title="Supply Chain View Failed"
      message={error.message || "Could not render supply chain data."}
      reset={reset}
    />
  );
}
