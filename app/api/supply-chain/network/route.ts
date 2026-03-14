import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { listSupplierNetworkOverview, SupplyChainServiceError } from "@/lib/supply-chain/mapping";
import { SupplierExposureQuerySchema } from "@/lib/validations/supply-chain";

function toServiceErrorResponse(error: unknown, defaultCode: string, defaultMessage: string) {
  if (error instanceof SupplyChainServiceError) {
    return apiError(
      {
        code: error.code,
        message: error.message,
      },
      error.status,
    );
  }

  return apiError(
    {
      code: defaultCode,
      message: defaultMessage,
    },
    500,
  );
}

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const queryParams = Object.fromEntries(new URL(request.url).searchParams.entries());
  const queryParsed = SupplierExposureQuerySchema.safeParse(queryParams);

  if (!queryParsed.success) {
    return apiError(
      {
        code: "SUPPLIER_NETWORK_QUERY_VALIDATION_ERROR",
        message: "Invalid network query parameters.",
        fieldErrors: zodFieldErrors(queryParsed.error),
      },
      400,
    );
  }

  try {
    const items = await listSupplierNetworkOverview(
      contextResult.context.supabase,
      contextResult.context.organizationId,
      queryParsed.data.includeInactive,
    );

    return apiSuccess({ items, total: items.length });
  } catch (error) {
    return toServiceErrorResponse(
      error,
      "SUPPLIER_NETWORK_LIST_FAILED",
      "Failed to load supplier network overview.",
    );
  }
}
