"use client";

export default function PlanDetailError({ error }: { error: Error }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
      Failed to load plan: {error.message}
    </div>
  );
}
