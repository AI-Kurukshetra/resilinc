"use client";

interface RouteErrorProps {
  title: string;
  message: string;
  reset: () => void;
}

export function RouteError({ message, reset, title }: RouteErrorProps) {
  return (
    <main className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-lg font-semibold text-rose-900">{title}</h2>
      <p className="mt-2 text-sm text-rose-800">{message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </main>
  );
}
