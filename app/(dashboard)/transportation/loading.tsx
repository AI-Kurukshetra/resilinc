export default function TransportationLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mac-surface h-40 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
