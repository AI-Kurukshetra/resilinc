export default function AlertDetailLoading() {
  return (
    <main className="space-y-4">
      <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </main>
  );
}
