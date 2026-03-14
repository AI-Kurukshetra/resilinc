import type { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardErrorState } from "@/app/(dashboard)/_components/dashboard-error-state";
import { DashboardUnauthorizedState } from "@/app/(dashboard)/_components/dashboard-unauthorized-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface BootstrapResult {
  ok: boolean;
  errorMessage?: string;
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const bootstrapResult = await ensureProfileBootstrap(supabase, user);

  if (!bootstrapResult.ok) {
    return (
      <DashboardErrorState
        title="Profile setup failed"
        description={
          bootstrapResult.errorMessage ||
          "We could not initialize your profile. Try again or contact support."
        }
      />
    );
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return (
      <DashboardErrorState
        title="Workspace lookup failed"
        description="We could not verify your organization membership for this session."
      />
    );
  }

  if (!membership?.organization_id) {
    return <DashboardUnauthorizedState />;
  }

  return <section>{children}</section>;
}

async function ensureProfileBootstrap(supabase: SupabaseClient, user: User): Promise<BootstrapResult> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false,
      errorMessage: profileError.message,
    };
  }

  if (profile?.user_id) {
    return { ok: true };
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    user_id: user.id,
    full_name: readUserDisplayName(user),
  });

  if (insertError && !isUniqueViolation(insertError)) {
    return {
      ok: false,
      errorMessage: insertError.message,
    };
  }

  return { ok: true };
}

function readUserDisplayName(user: User): string | null {
  const metadata = user.user_metadata;

  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const fullName = readMetadataString(metadata, "full_name");
  if (fullName) {
    return fullName;
  }

  return readMetadataString(metadata, "name");
}

function readMetadataString(value: object, key: string): string | null {
  if (!(key in value)) {
    return null;
  }

  const metadataValue = (value as Record<string, unknown>)[key];

  if (typeof metadataValue !== "string") {
    return null;
  }

  const trimmedValue = metadataValue.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function isUniqueViolation(error: PostgrestError): boolean {
  return error.code === "23505";
}
