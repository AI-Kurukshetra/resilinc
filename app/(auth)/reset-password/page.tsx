import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLink, AuthPageShell } from "@/app/(auth)/_components/auth-page-shell";
import { ResetPasswordForm } from "@/app/(auth)/_components/reset-password-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reset Password | Resilinc Lite",
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/overview");
  }

  return (
    <AuthPageShell
      title="Reset password"
      description="Enter your email and we will send a reset link."
      footer={
        <p>
          Back to <AuthLink href="/login" text="Sign in" />
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthPageShell>
  );
}
