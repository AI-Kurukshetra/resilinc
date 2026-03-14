import { z } from "zod";
import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { getSupplierExposure, SupplyChainServiceError } from "@/lib/supply-chain/mapping";
import { SupplierExposureQuerySchema } from "@/lib/validations/supply-chain";

const SupplierIdParamSchema = z.object({
  supplierId: z.string().uuid("Invalid supplier id."),
});

interface SupplierExposureRouteContext {
  params: Promise<{ supplierId: string }>;
}

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

export async function GET(request: Request, { params }: SupplierExposureRouteContext) {
  const paramParsed = SupplierIdParamSchema.safeParse(await params);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "SUPPLIER_EXPOSURE_PATH_VALIDATION_ERROR",
        message: "Invalid supplier id.",
        fieldErrors: zodFieldErrors(paramParsed.error),
      },
      400,
    );
  }

  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const queryParams = Object.fromEntries(new URL(request.url).searchParams.entries());
  const queryParsed = SupplierExposureQuerySchema.safeParse(queryParams);

  if (!queryParsed.success) {
    return apiError(
      {
        code: "SUPPLIER_EXPOSURE_QUERY_VALIDATION_ERROR",
        message: "Invalid exposure query parameters.",
        fieldErrors: zodFieldErrors(queryParsed.error),
      },
      400,
    );
  }

  try {
    const data = await getSupplierExposure(
      contextResult.context.supabase,
      contextResult.context.organizationId,
      paramParsed.data.supplierId,
      queryParsed.data.includeInactive,
    );

    return apiSuccess(data);
  } catch (error) {
    return toServiceErrorResponse(
      error,
      "SUPPLIER_EXPOSURE_LOOKUP_FAILED",
      "Failed to load supplier exposure.",
    );
  }
}
