import { z } from "zod";
import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { apiErrorFromDbError } from "@/lib/api/db-errors";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { PartUpdateSchema } from "@/lib/validations/supply-chain";

const PartIdParamSchema = z.object({
  partId: z.string().uuid("Invalid part id."),
});

interface PartRecord {
  id: string;
  part_number: string;
  description: string | null;
  criticality: number;
  created_at: string;
}

function toPartDto(record: PartRecord) {
  return {
    createdAt: record.created_at,
    criticality: record.criticality,
    description: record.description,
    partId: record.id,
    partNumber: record.part_number,
  };
}

function parsePartId(params: { partId: string }) {
  return PartIdParamSchema.safeParse(params);
}

interface PartRouteContext {
  params: Promise<{ partId: string }>;
}

export async function GET(_request: Request, { params }: PartRouteContext) {
  const paramParsed = parsePartId(await params);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "PART_PATH_VALIDATION_ERROR",
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

  const { organizationId, supabase } = contextResult.context;

  const { data, error } = await supabase
    .from("parts")
    .select("id, part_number, description, criticality, created_at")
    .eq("organization_id", organizationId)
    .eq("id", paramParsed.data.partId)
    .maybeSingle();

  if (error) {
    return apiError(
      {
        code: "PART_LOOKUP_FAILED",
        message: error.message || "Failed to lookup part.",
      },
      500,
    );
  }

  if (!data) {
    return apiError(
      {
        code: "PART_NOT_FOUND",
        message: "Part not found.",
      },
      404,
    );
  }

  return apiSuccess(toPartDto(data as PartRecord));
}

export async function PATCH(request: Request, { params }: PartRouteContext) {
  const paramParsed = parsePartId(await params);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "PART_PATH_VALIDATION_ERROR",
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

  const body = await readJsonBody(request);
  const parsed = PartUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "PART_VALIDATION_ERROR",
        message: "Invalid part update payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;

  const updatePayload: {
    criticality?: number;
    description?: string | null;
    part_number?: string;
  } = {};

  if (parsed.data.partNumber !== undefined) {
    updatePayload.part_number = parsed.data.partNumber;
  }

  if (parsed.data.description !== undefined) {
    updatePayload.description = parsed.data.description ?? null;
  }

  if (parsed.data.criticality !== undefined) {
    updatePayload.criticality = parsed.data.criticality;
  }

  const { data, error } = await supabase
    .from("parts")
    .update(updatePayload)
    .eq("organization_id", organizationId)
    .eq("id", paramParsed.data.partId)
    .select("id, part_number, description, criticality, created_at")
    .maybeSingle();

  if (error) {
    return apiErrorFromDbError(error, {
      conflictCode: "PART_CONFLICT",
      conflictMessage: "Part number already exists in your organization.",
      defaultCode: "PART_UPDATE_FAILED",
      defaultMessage: "Failed to update part.",
    });
  }

  if (!data) {
    return apiError(
      {
        code: "PART_NOT_FOUND",
        message: "Part not found.",
      },
      404,
    );
  }

  return apiSuccess(toPartDto(data as PartRecord));
}

export async function DELETE(_request: Request, { params }: PartRouteContext) {
  const paramParsed = parsePartId(await params);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "PART_PATH_VALIDATION_ERROR",
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

  const { organizationId, supabase } = contextResult.context;

  const { data, error } = await supabase
    .from("parts")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", paramParsed.data.partId)
    .select("id")
    .maybeSingle();

  if (error) {
    return apiErrorFromDbError(error, {
      conflictCode: "PART_DELETE_CONFLICT",
      conflictMessage: "Part cannot be deleted because it is linked to suppliers or events.",
      defaultCode: "PART_DELETE_FAILED",
      defaultMessage: "Failed to delete part.",
      foreignKeyCode: "PART_DELETE_CONFLICT",
      foreignKeyMessage: "Part cannot be deleted because it is linked to suppliers or events.",
    });
  }

  if (!data) {
    return apiError(
      {
        code: "PART_NOT_FOUND",
        message: "Part not found.",
      },
      404,
    );
  }

  return apiSuccess({ deleted: true, partId: paramParsed.data.partId });
}
