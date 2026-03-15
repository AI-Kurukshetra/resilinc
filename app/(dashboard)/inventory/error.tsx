"use client";

export default function InventoryError({ error }: { error: Error }) {
  return (
    <main className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
      <h2 className="text-lg font-semibold">Inventory Error</h2>
      <p className="mt-2">{error.message || "Failed to load inventory data."}</p>
    </main>
  );
}
