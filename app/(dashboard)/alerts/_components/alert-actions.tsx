"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

interface MemberOption {
  label: string;
  userId: string;
}

interface AlertActionsProps {
  alertId: string;
  canAcknowledge: boolean;
  canResolve: boolean;
  currentOwnerId: string | null;
  members: MemberOption[];
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (response.ok) {
    return;
  }

  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;

  throw new Error(payload?.error?.message || `Request failed (${response.status}).`);
}

export function AlertActions({
  alertId,
  canAcknowledge,
  canResolve,
  currentOwnerId,
  members,
}: AlertActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState(currentOwnerId ?? members[0]?.userId ?? "");
  const [ackNote, setAckNote] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");

  const canAssign = useMemo(
    () => ownerId.length > 0 && ownerId !== currentOwnerId,
    [currentOwnerId, ownerId],
  );

  function handleAction(action: () => Promise<void>) {
    startTransition(async () => {
      setErrorMessage(null);
      try {
        await action();
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Action failed.");
      }
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Alert Actions</h2>

      {errorMessage ? (
        <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="ownerId">
            Assign owner
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              id="ownerId"
              value={ownerId}
              onChange={(event) => setOwnerId(event.target.value)}
              className="min-w-[220px] rounded-md border border-slate-300 px-3 py-2 text-sm"
              disabled={isPending || members.length === 0}
            >
              {members.length === 0 ? <option value="">No members available</option> : null}
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!canAssign || isPending}
              onClick={() =>
                handleAction(() =>
                  postJson(`/api/alerts/${alertId}/assign`, {
                    ownerId,
                  }),
                )
              }
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save owner
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="ackNote">
            Acknowledge note
          </label>
          <textarea
            id="ackNote"
            value={ackNote}
            onChange={(event) => setAckNote(event.target.value)}
            placeholder="Add context for responders"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            disabled={isPending || !canAcknowledge}
          />
          <button
            type="button"
            disabled={!canAcknowledge || isPending}
            onClick={() =>
              handleAction(() =>
                postJson(`/api/alerts/${alertId}/acknowledge`, {
                  note: ackNote.trim() || undefined,
                }),
              )
            }
            className="mt-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Acknowledge alert
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="resolutionNote">
            Resolution note
          </label>
          <textarea
            id="resolutionNote"
            value={resolutionNote}
            onChange={(event) => setResolutionNote(event.target.value)}
            placeholder="Describe mitigation and closure rationale"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            disabled={isPending || !canResolve}
          />
          <button
            type="button"
            disabled={!canResolve || isPending}
            onClick={() =>
              handleAction(() =>
                postJson(`/api/alerts/${alertId}/resolve`, {
                  resolutionNote: resolutionNote.trim() || undefined,
                }),
              )
            }
            className="mt-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Resolve alert
          </button>
        </div>
      </div>
    </section>
  );
}
