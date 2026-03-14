import type { SupabaseClient, User } from "@supabase/supabase-js";
import { apiError, type ApiErrorResponse } from "@/lib/api/responses";
import { isAuthBypassEnabled } from "@/lib/auth/feature-flags";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";

interface OrgApiContext {
  actorName: string;
  organizationId: string;
  supabase: SupabaseClient;
}

type OrgApiContextResult =
  | {
      context: OrgApiContext;
      errorResponse: null;
    }
  | {
      context: null;
      errorResponse: ReturnType<typeof apiError>;
    };

const BYPASS_ACTOR_NAME = "Akash Bhavsar";
const BYPASS_ORGANIZATION_NAME = "Apex Devices Group";

function readUserDisplayName(user: User): string {
  const metadata = user.user_metadata;

  if (metadata && typeof metadata === "object") {
    const fullName = (metadata as Record<string, unknown>).full_name;
    if (typeof fullName === "string" && fullName.trim().length > 0) {
      return fullName.trim();
    }

    const name = (metadata as Record<string, unknown>).name;
    if (typeof name === "string" && name.trim().length > 0) {
      return name.trim();
    }
  }

  if (typeof user.email === "string" && user.email.trim().length > 0) {
    return user.email;
  }

  return "Authenticated User";
}

async function resolveBypassOrganizationId(supabase: SupabaseClient): Promise<string | null> {
  const { data: existingOrg, error: existingOrgError } = await supabase
    .from("organizations")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingOrgError) {
    throw new Error(existingOrgError.message);
  }

  if (existingOrg?.id) {
    return existingOrg.id;
  }

  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });

  if (usersError) {
    throw new Error(usersError.message);
  }

  const demoUserId = usersData.users[0]?.id;
  if (!demoUserId) {
    return null;
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: demoUserId,
      full_name: BYPASS_ACTOR_NAME,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: createdOrg, error: createdOrgError } = await supabase
    .from("organizations")
    .insert({
      created_by: demoUserId,
      name: BYPASS_ORGANIZATION_NAME,
    })
    .select("id")
    .single();

  if (createdOrgError || !createdOrg?.id) {
    throw new Error(createdOrgError?.message || "Failed to create bypass organization.");
  }

  const { error: membershipError } = await supabase.from("organization_members").upsert(
    {
      organization_id: createdOrg.id,
      role: "owner",
      user_id: demoUserId,
    },
    { onConflict: "organization_id,user_id" },
  );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  return createdOrg.id;
}

export async function requireOrgApiContext(): Promise<OrgApiContextResult> {
  if (isAuthBypassEnabled()) {
    try {
      const supabase = createServiceRoleSupabaseClient();
      const organizationId = await resolveBypassOrganizationId(supabase);

      if (!organizationId) {
        return {
          context: null,
          errorResponse: apiError(
            {
              code: "DEMO_CONTEXT_UNAVAILABLE",
              message: "No auth user exists yet. Create one account once, then retry.",
            },
            503,
          ),
        };
      }

      return {
        context: {
          actorName: BYPASS_ACTOR_NAME,
          organizationId,
          supabase,
        },
        errorResponse: null,
      };
    } catch (error) {
      return {
        context: null,
        errorResponse: apiError(
          {
            code: "DEMO_CONTEXT_SETUP_FAILED",
            message: error instanceof Error ? error.message : "Failed to initialize bypass context.",
          },
          500,
        ),
      };
    }
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      context: null,
      errorResponse: apiError(
        {
          code: "AUTH_REQUIRED",
          message: "You must be signed in to access this endpoint.",
        },
        401,
      ),
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return {
      context: null,
      errorResponse: apiError(
        {
          code: "ORG_MEMBERSHIP_LOOKUP_FAILED",
          message: "Could not verify organization membership.",
        },
        500,
      ),
    };
  }

  if (!membership?.organization_id) {
    return {
      context: null,
      errorResponse: apiError(
        {
          code: "ORG_ACCESS_DENIED",
          message: "Signed-in account is not assigned to an organization.",
        },
        403,
      ),
    };
  }

  return {
    context: {
      actorName: readUserDisplayName(user),
      organizationId: membership.organization_id,
      supabase,
    },
    errorResponse: null,
  };
}

export type { OrgApiContext, OrgApiContextResult, ApiErrorResponse };
