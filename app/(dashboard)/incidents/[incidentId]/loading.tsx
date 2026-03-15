export default function IncidentDetailLoading() {
  return (
    <main className="space-y-4">
      <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="h-80 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </main>
  );
}
