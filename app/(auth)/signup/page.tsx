import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLink, AuthPageShell } from "@/app/(auth)/_components/auth-page-shell";
import { SignupForm } from "@/app/(auth)/_components/signup-form";
import { sanitizeNextPath } from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign Up | Resilinc Lite",
};

interface SignupPageProps {
  searchParams?:
    | Promise<{
        next?: string | string[];
      }>
    | {
        next?: string | string[];
      };
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/overview");
  }

  return (
    <AuthPageShell
      title="Create account"
      description="Set up your Resilinc Lite account."
      footer={
        <p>
          Already have an account? <AuthLink href="/login" text="Sign in" />
        </p>
      }
    >
      <SignupForm nextPath={sanitizeNextPath(readSingleParam(params?.next), "/overview")} />
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
