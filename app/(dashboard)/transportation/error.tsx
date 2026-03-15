"use client";

export default function TransportationError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mac-surface rounded-2xl p-8 text-center">
      <h2 className="text-sm font-semibold text-red-700">Failed to load transportation routes</h2>
      <p className="mt-1 text-xs text-slate-500">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
      >
        Retry
      </button>
    </div>
  );
}
