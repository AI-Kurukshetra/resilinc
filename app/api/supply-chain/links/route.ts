import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import {
  deleteSupplierPartTierLink,
  listSupplierPartTierLinks,
  SupplyChainServiceError,
  upsertSupplierPartTierLink,
} from "@/lib/supply-chain/mapping";
import {
  SupplierPartLinkDeleteSchema,
  SupplierPartLinkListQuerySchema,
  SupplierPartLinkUpsertSchema,
} from "@/lib/validations/supply-chain";

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

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const queryParsed = SupplierPartLinkListQuerySchema.safeParse(params);

  if (!queryParsed.success) {
    return apiError(
      {
        code: "SUPPLIER_PART_LINK_QUERY_VALIDATION_ERROR",
        message: "Invalid supplier-part link query parameters.",
        fieldErrors: zodFieldErrors(queryParsed.error),
      },
      400,
    );
  }

  try {
    const data = await listSupplierPartTierLinks(
      contextResult.context.supabase,
      contextResult.context.organizationId,
      queryParsed.data,
    );

    return apiSuccess(data);
  } catch (error) {
    return toServiceErrorResponse(
      error,
      "SUPPLIER_PART_LINK_LIST_FAILED",
      "Failed to list supplier-part links.",
    );
  }
}

export async function POST(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const body = await readJsonBody(request);
  const parsed = SupplierPartLinkUpsertSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "SUPPLIER_PART_LINK_VALIDATION_ERROR",
        message: "Invalid supplier-part link payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  try {
    const data = await upsertSupplierPartTierLink(
      contextResult.context.supabase,
      contextResult.context.organizationId,
      parsed.data,
    );

    return apiSuccess(data, 201);
  } catch (error) {
    return toServiceErrorResponse(
      error,
      "SUPPLIER_PART_LINK_UPSERT_FAILED",
      "Failed to create supplier-part link.",
    );
  }
}

export async function DELETE(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const body = await readJsonBody(request);
  const parsed = SupplierPartLinkDeleteSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "SUPPLIER_PART_LINK_VALIDATION_ERROR",
        message: "Invalid supplier-part unlink payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  try {
    await deleteSupplierPartTierLink(
      contextResult.context.supabase,
      contextResult.context.organizationId,
      parsed.data.supplierId,
      parsed.data.partId,
    );

    return apiSuccess({
      deleted: true,
      partId: parsed.data.partId,
      supplierId: parsed.data.supplierId,
    });
  } catch (error) {
    return toServiceErrorResponse(
      error,
      "SUPPLIER_PART_LINK_DELETE_FAILED",
      "Failed to delete supplier-part link.",
    );
  }
}
