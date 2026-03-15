import { requireOrgApiContext } from "@/lib/api/org-context";

export interface DashboardContext {
  actorName: string;
  actorUserId: string | null;
  organizationId: string;
  supabase: NonNullable<Awaited<ReturnType<typeof requireOrgApiContext>>["context"]>["supabase"];
}

export async function getDashboardContext(): Promise<DashboardContext | null> {
  const contextResult = await requireOrgApiContext();

  if (contextResult.errorResponse || !contextResult.context) {
    return null;
  }

  return contextResult.context;
}
