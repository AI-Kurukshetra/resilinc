import type { Metadata } from "next";
import { AuthLink, AuthPageShell } from "@/app/(auth)/_components/auth-page-shell";
import { UpdatePasswordForm } from "@/app/(auth)/_components/update-password-form";

export const metadata: Metadata = {
  title: "Update Password | Resilinc Lite",
};

interface UpdatePasswordPageProps {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
}

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const hasRecoveryError = readSingleParam(params?.error) === "1";

  return (
    <AuthPageShell
      title="Set a new password"
      description="Use your reset link to choose a new password."
      footer={
        <p>
          Need another email? <AuthLink href="/reset-password" text="Request reset link" />
        </p>
      }
    >
      <UpdatePasswordForm hasRecoveryError={hasRecoveryError} />
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
