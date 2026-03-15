export default function IntegrationsLoading() {
  return (
    <main className="space-y-4">
      <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    </main>
  );
}
