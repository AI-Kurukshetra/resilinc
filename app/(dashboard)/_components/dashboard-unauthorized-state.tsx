import Link from "next/link";

export function DashboardUnauthorizedState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-lg space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-900">No organization access</h1>
        <p className="text-sm text-amber-900/90">
          Your account is authenticated, but it is not assigned to an organization yet.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/logout"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Sign out
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900"
          >
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
