import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoutForm } from "@/app/(auth)/_components/logout-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign Out | Resilinc Lite",
};

export default async function LogoutPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Sign out</h1>
        <p className="text-sm text-slate-600">You are currently signed in.</p>
        <LogoutForm />
      </section>
    </main>
  );
}
