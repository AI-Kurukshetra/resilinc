import { z } from "zod";
import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import {
  getPartFinancialProfile,
  upsertPartFinancialProfile,
  updatePartFinancialProfile,
} from "@/lib/impact-analysis/service";
import {
  PartFinancialProfileCreateSchema,
  PartFinancialProfileUpdateSchema,
} from "@/lib/validations/impact-analysis";

const PartIdParamSchema = z.object({
  partId: z.string().uuid("Invalid part id."),
});

interface PartFinancialRouteContext {
  params: Promise<{ partId: string }>;
}

export async function GET(_request: Request, { params }: PartFinancialRouteContext) {
  const paramParsed = PartIdParamSchema.safeParse(await params);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "PART_FINANCIAL_PATH_VALIDATION_ERROR",
        message: "Invalid part id.",
        fieldErrors: zodFieldErrors(paramParsed.error),
      },
      400,
    );
  }

  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  try {
    const profile = await getPartFinancialProfile(
      contextResult.context.supabase,
      contextResult.context.organizationId,
      paramParsed.data.partId,
    );

    return apiSuccess(profile);
  } catch (error) {
    return apiError(
      {
        code: "PART_FINANCIAL_LOOKUP_FAILED",
        message: error instanceof Error ? error.message : "Failed to get financial profile.",
      },
      500,
    );
  }
}

export async function PUT(request: Request, { params }: PartFinancialRouteContext) {
  const paramParsed = PartIdParamSchema.safeParse(await params);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "PART_FINANCIAL_PATH_VALIDATION_ERROR",
        message: "Invalid part id.",
        fieldErrors: zodFieldErrors(paramParsed.error),
      },
      400,
    );
  }

  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  // Check if profile exists — create or update
  const existingProfile = await getPartFinancialProfile(
    contextResult.context.supabase,
    contextResult.context.organizationId,
    paramParsed.data.partId,
  );

  if (existingProfile) {
    const updateParsed = PartFinancialProfileUpdateSchema.safeParse(body);
    if (!updateParsed.success) {
      return apiError(
        {
          code: "PART_FINANCIAL_VALIDATION_ERROR",
          message: "Invalid financial profile update.",
          fieldErrors: zodFieldErrors(updateParsed.error),
        },
        400,
      );
    }

    try {
      const updated = await updatePartFinancialProfile(
        contextResult.context.supabase,
        contextResult.context.organizationId,
        paramParsed.data.partId,
        updateParsed.data,
      );
      return apiSuccess(updated);
    } catch (error) {
      return apiError(
        {
          code: "PART_FINANCIAL_UPDATE_FAILED",
          message: error instanceof Error ? error.message : "Failed to update financial profile.",
        },
        500,
      );
    }
  }

  // Create new
  const createInput = { ...(body as Record<string, unknown>), partId: paramParsed.data.partId };
  const createParsed = PartFinancialProfileCreateSchema.safeParse(createInput);

  if (!createParsed.success) {
    return apiError(
      {
        code: "PART_FINANCIAL_VALIDATION_ERROR",
        message: "Invalid financial profile data.",
        fieldErrors: zodFieldErrors(createParsed.error),
      },
      400,
    );
  }

  try {
    const created = await upsertPartFinancialProfile(
      contextResult.context.supabase,
      contextResult.context.organizationId,
      createParsed.data,
    );
    return apiSuccess(created, 201);
  } catch (error) {
    return apiError(
      {
        code: "PART_FINANCIAL_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Failed to create financial profile.",
      },
      500,
    );
  }
}
