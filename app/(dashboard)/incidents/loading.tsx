export default function IncidentsLoading() {
  return (
    <main className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </main>
  );
}
