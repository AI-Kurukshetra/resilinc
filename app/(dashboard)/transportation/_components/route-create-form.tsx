"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export function RouteCards() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition"
      >
        + Add Route
      </button>
      {isOpen && <RouteCreateForm onClose={() => setIsOpen(false)} />}
    </>
  );
}

function RouteCreateForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);

      const formData = new FormData(e.currentTarget);
      const body = {
        name: formData.get("name") as string,
        destinationName: formData.get("destinationName") as string,
        transportMode: formData.get("transportMode") as string,
        estimatedTransitDays: Number(formData.get("estimatedTransitDays") || 0),
        activeDisruptions: (formData.get("activeDisruptions") as string) || null,
      };

      try {
        const res = await fetch("/api/transportation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const json = (await res.json()) as { error?: { message?: string } };
          setError(json.error?.message ?? "Failed to create route");
          return;
        }

        router.refresh();
        onClose();
      } catch {
        setError("Network error");
      } finally {
        setSubmitting(false);
      }
    },
    [router, onClose],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">New Transportation Route</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            placeholder="Route name"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            name="destinationName"
            placeholder="Destination"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            name="transportMode"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="ocean">Ocean</option>
            <option value="air">Air</option>
            <option value="rail">Rail</option>
            <option value="road">Road</option>
            <option value="multimodal">Multimodal</option>
          </select>
          <input
            name="estimatedTransitDays"
            type="number"
            min="0"
            placeholder="Estimated transit days"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            name="activeDisruptions"
            placeholder="Active disruptions (optional)"
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Route"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
