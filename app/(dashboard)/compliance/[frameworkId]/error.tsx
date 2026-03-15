"use client";

export default function FrameworkDetailError({ error }: { error: Error }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
      Failed to load compliance framework: {error.message}
    </div>
  );
}
