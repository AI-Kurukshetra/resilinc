import Link from "next/link";

interface DashboardErrorStateProps {
  title: string;
  description: string;
}

export function DashboardErrorState({ title, description }: DashboardErrorStateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-lg space-y-4 rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-900">{title}</h1>
        <p className="text-sm text-red-900/90">{description}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/overview"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900"
          >
            Retry
          </Link>
          <Link
            href="/logout"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Sign out
          </Link>
        </div>
      </section>
    </main>
  );
}
