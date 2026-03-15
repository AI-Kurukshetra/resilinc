export default function SuppliersLoading() {
  return (
    <main className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </main>
  );
}
