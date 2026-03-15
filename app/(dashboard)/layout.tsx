import type { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardErrorState } from "@/app/(dashboard)/_components/dashboard-error-state";
import { DashboardNav } from "@/app/(dashboard)/_components/dashboard-nav";
import { DashboardUnauthorizedState } from "@/app/(dashboard)/_components/dashboard-unauthorized-state";
import { isAuthBypassEnabled } from "@/lib/auth/feature-flags";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";

interface BootstrapResult {
  ok: boolean;
  errorMessage?: string;
}

interface MembershipBootstrapResult {
  ok: boolean;
  organizationId?: string;
  errorMessage?: string;
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  if (isAuthBypassEnabled()) {
    return (
      <div className="min-h-screen">
        <DashboardNav />
        <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-8">{children}</section>
      </div>
    );
  }

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

  const membershipResult = await ensureOrganizationMembershipBootstrap(supabase, user);

  if (!membershipResult.ok) {
    return (
      <DashboardErrorState
        title="Workspace setup failed"
        description={
          membershipResult.errorMessage ||
          "We could not initialize your organization membership for this session."
        }
      />
    );
  }

  if (!membershipResult.organizationId) {
    return <DashboardUnauthorizedState />;
  }

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-8">{children}</section>
    </div>
  );
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

async function ensureOrganizationMembershipBootstrap(
  supabase: SupabaseClient,
  user: User,
): Promise<MembershipBootstrapResult> {
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return {
      ok: false,
      errorMessage: membershipError.message,
    };
  }

  if (membership?.organization_id) {
    return {
      ok: true,
      organizationId: membership.organization_id,
    };
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .insert({
      created_by: user.id,
      name: buildPersonalOrganizationName(user),
    })
    .select("id")
    .single();

  if (organizationError || !organization?.id) {
    if (shouldTryPrivilegedBootstrap(organizationError)) {
      const fallbackResult = await bootstrapWorkspaceWithServiceRole(user);
      if (fallbackResult.organizationId) {
        return {
          ok: true,
          organizationId: fallbackResult.organizationId,
        };
      }

      return {
        ok: false,
        errorMessage:
          organizationError?.message || fallbackResult.errorMessage || "Failed to create organization.",
      };
    }

    return {
      ok: false,
      errorMessage: organizationError?.message || "Failed to create organization.",
    };
  }

  const { error: ownerMembershipError } = await supabase.from("organization_members").insert({
    organization_id: organization.id,
    role: "owner",
    user_id: user.id,
  });

  if (ownerMembershipError && !isUniqueViolation(ownerMembershipError)) {
    if (shouldTryPrivilegedBootstrap(ownerMembershipError)) {
      const fallbackResult = await bootstrapWorkspaceWithServiceRole(user);
      if (fallbackResult.organizationId) {
        return {
          ok: true,
          organizationId: fallbackResult.organizationId,
        };
      }

      return {
        ok: false,
        errorMessage: ownerMembershipError.message || fallbackResult.errorMessage,
      };
    }

    return {
      ok: false,
      errorMessage: ownerMembershipError.message,
    };
  }

  return {
    ok: true,
    organizationId: organization.id,
  };
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

function buildPersonalOrganizationName(user: User): string {
  const fullName = readUserDisplayName(user);
  if (fullName) {
    return `${fullName} Workspace`;
  }

  const emailHandle = readEmailHandle(user.email);
  if (emailHandle) {
    return `${emailHandle} Workspace`;
  }

  return "My Workspace";
}

function readEmailHandle(email: string | undefined): string | null {
  if (!email) {
    return null;
  }

  const [localPart] = email.split("@");
  const normalized = localPart.trim();

  return normalized.length > 0 ? normalized : null;
}

function isUniqueViolation(error: PostgrestError): boolean {
  return error.code === "23505";
}

function shouldTryPrivilegedBootstrap(error: PostgrestError | null | undefined): boolean {
  if (!error) {
    return false;
  }

  const normalizedMessage = error.message.toLowerCase();

  return (
    error.code === "42501" ||
    normalizedMessage.includes("row-level security") ||
    normalizedMessage.includes("permission denied")
  );
}

async function bootstrapWorkspaceWithServiceRole(
  user: User,
): Promise<{ organizationId?: string; errorMessage?: string }> {
  try {
    const adminSupabase = createServiceRoleSupabaseClient();

    const { data: existingMembership, error: existingMembershipError } = await adminSupabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingMembershipError) {
      return {
        errorMessage: existingMembershipError.message,
      };
    }

    if (existingMembership?.organization_id) {
      return {
        organizationId: existingMembership.organization_id,
      };
    }

    const { error: profileUpsertError } = await adminSupabase.from("profiles").upsert(
      {
        user_id: user.id,
        full_name: readUserDisplayName(user),
      },
      { onConflict: "user_id" },
    );

    if (profileUpsertError) {
      return {
        errorMessage: profileUpsertError.message,
      };
    }

    const { data: existingOrganization, error: existingOrganizationError } = await adminSupabase
      .from("organizations")
      .select("id")
      .eq("created_by", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingOrganizationError) {
      return {
        errorMessage: existingOrganizationError.message,
      };
    }

    let organizationId = existingOrganization?.id;

    if (!organizationId) {
      const { data: createdOrganization, error: createOrganizationError } = await adminSupabase
        .from("organizations")
        .insert({
          created_by: user.id,
          name: buildPersonalOrganizationName(user),
        })
        .select("id")
        .single();

      if (createOrganizationError || !createdOrganization?.id) {
        return {
          errorMessage: createOrganizationError?.message || "Failed to create organization.",
        };
      }

      organizationId = createdOrganization.id;
    }

    const { error: ownerMembershipError } = await adminSupabase
      .from("organization_members")
      .upsert(
        {
          organization_id: organizationId,
          role: "owner",
          user_id: user.id,
        },
        { onConflict: "organization_id,user_id" },
      );

    if (ownerMembershipError) {
      return {
        errorMessage: ownerMembershipError.message,
      };
    }

    return {
      organizationId,
    };
  } catch (error) {
    return {
      errorMessage:
        error instanceof Error
          ? error.message
          : "Workspace bootstrap fallback failed unexpectedly.",
    };
  }
}
