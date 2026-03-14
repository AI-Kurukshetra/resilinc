import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Overview | Resilinc Lite",
};

export default function OverviewPage() {
  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Overview dashboard scaffold</h1>
      <Link
        href="/logout"
        className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Sign out
      </Link>
    </main>
  );
}
