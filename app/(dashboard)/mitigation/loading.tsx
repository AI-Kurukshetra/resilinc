export default function MitigationLoading() {
  return (
    <div className="space-y-4">
      <div className="mac-surface h-20 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mac-surface h-36 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
