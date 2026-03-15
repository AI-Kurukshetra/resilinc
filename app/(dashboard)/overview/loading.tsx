export default function OverviewLoading() {
  return (
    <main className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded-md bg-slate-200" />
      <div className="h-4 w-72 animate-pulse rounded-md bg-slate-200" />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg border bg-slate-100" />
        ))}
      </section>
      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="h-5 w-40 animate-pulse rounded-md bg-slate-200" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-md border bg-slate-100" />
        ))}
      </section>
    </main>
  );
}
