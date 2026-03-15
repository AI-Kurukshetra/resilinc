import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Resilinc Lite | Supply Chain Risk Intelligence",
  description:
    "Monitor disruptions, score supplier risk, trigger alerts, and coordinate incident response.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryCtaHref = user ? "/overview" : "/login";
  const primaryCtaLabel = user ? "Open Workspace" : "Sign In";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-16">
      <section className="mac-surface rounded-3xl p-6 md:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Resilinc Lite</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-slate-900 md:text-5xl">
          Enterprise supply chain resilience with real-time risk operations.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-slate-600 md:text-base">
          Detect disruptions, map supplier exposure, generate risk alerts, and drive incident
          response workflows in one platform.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={primaryCtaHref}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {primaryCtaLabel}
          </Link>
          {user ? null : (
            <Link
              href="/signup"
              className="rounded-xl border border-slate-300 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700"
            >
              Create Account
            </Link>
          )}
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        <article className="mac-surface rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-slate-900">Disruption Intelligence</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ingest external risk signals with normalized severity, confidence, and provenance.
          </p>
        </article>
        <article className="mac-surface rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-slate-900">Alert to Incident Flow</h2>
          <p className="mt-1 text-sm text-slate-600">
            Convert supplier risk thresholds into alerts and playbook-driven incident actions.
          </p>
        </article>
        <article className="mac-surface rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-slate-900">Operational Reporting</h2>
          <p className="mt-1 text-sm text-slate-600">
            Export executive snapshots across alerts, incidents, and supplier risk posture.
          </p>
        </article>
      </section>
    </main>
  );
}
