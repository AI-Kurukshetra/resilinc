export default function InventoryLoading() {
  return (
    <main className="space-y-4">
      <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
    </main>
  );
}
