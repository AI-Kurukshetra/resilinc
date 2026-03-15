import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { InventoryServiceError, listInventoryLevels, upsertInventoryLevel } from "@/lib/inventory/service";
import { InventoryListQuerySchema, InventoryLevelUpsertSchema } from "@/lib/validations/inventory";

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = InventoryListQuerySchema.safeParse(params);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid query.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const data = await listInventoryLevels(supabase, organizationId, parsed.data);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof InventoryServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "INVENTORY_LIST_FAILED", message: "Unexpected error listing inventory." }, 500);
  }
}

export async function POST(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  const parsed = InventoryLevelUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid inventory data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const level = await upsertInventoryLevel(supabase, organizationId, parsed.data);
    return apiSuccess(level, 201);
  } catch (error) {
    if (error instanceof InventoryServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "INVENTORY_UPSERT_FAILED", message: "Unexpected error upserting inventory." }, 500);
  }
}
