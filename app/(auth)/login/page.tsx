import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLink, AuthPageShell } from "@/app/(auth)/_components/auth-page-shell";
import { LoginForm } from "@/app/(auth)/_components/login-form";
import { sanitizeNextPath } from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Login | Resilinc Lite",
};

interface LoginPageProps {
  searchParams?: Promise<{
    next?: string | string[];
    checkEmail?: string | string[];
    passwordReset?: string | string[];
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/overview");
  }

  const nextPath = sanitizeNextPath(readSingleParam(params?.next), "/overview");
  const showCheckEmailNotice = readSingleParam(params?.checkEmail) === "1";
  const showPasswordResetNotice = readSingleParam(params?.passwordReset) === "1";

  return (
    <AuthPageShell
      title="Sign in"
      description="Access your organization workspace."
      footer={
        <p>
          Need an account? <AuthLink href="/signup" text="Create one" />
          <span className="mx-2">•</span>
          <AuthLink href="/reset-password" text="Forgot password?" />
        </p>
      }
    >
      {showCheckEmailNotice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Check your inbox to confirm your account, then sign in.
        </p>
      ) : null}
      {showPasswordResetNotice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Password reset complete. Sign in with your new password.
        </p>
      ) : null}
      <LoginForm nextPath={nextPath} />
    </AuthPageShell>
  );
}

function readSingleParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return undefined;
}
