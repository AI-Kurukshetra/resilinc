import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { InventoryServiceError, upsertInventoryLevel } from "@/lib/inventory/service";
import { PartIdParamSchema, InventoryLevelUpsertSchema } from "@/lib/validations/inventory";

interface Params {
  params: Promise<{ partId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { partId } = await params;
  const paramParsed = PartIdParamSchema.safeParse({ partId });
  if (!paramParsed.success) {
    return apiError({ code: "INVALID_PART_ID", message: "Invalid part ID." }, 400);
  }

  const { organizationId, supabase } = contextResult.context;

  const { data, error } = await supabase
    .from("part_inventory_levels")
    .select("id, organization_id, part_id, current_stock, safety_stock, reorder_point, max_stock, avg_daily_consumption, days_of_supply, risk_flag, updated_at")
    .eq("organization_id", organizationId)
    .eq("part_id", partId)
    .maybeSingle();

  if (error) {
    return apiError({ code: "INVENTORY_GET_FAILED", message: error.message }, 500);
  }

  if (!data) {
    return apiError({ code: "INVENTORY_NOT_FOUND", message: "No inventory level found for this part." }, 404);
  }

  return apiSuccess(data);
}

export async function PUT(request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { partId } = await params;
  const paramParsed = PartIdParamSchema.safeParse({ partId });
  if (!paramParsed.success) {
    return apiError({ code: "INVALID_PART_ID", message: "Invalid part ID." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  const parsed = InventoryLevelUpsertSchema.safeParse({ ...body as Record<string, unknown>, partId });
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid inventory data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const level = await upsertInventoryLevel(supabase, organizationId, parsed.data);
    return apiSuccess(level);
  } catch (error) {
    if (error instanceof InventoryServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "INVENTORY_UPSERT_FAILED", message: "Unexpected error upserting inventory." }, 500);
  }
}
