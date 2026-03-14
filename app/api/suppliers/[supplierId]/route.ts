import { z } from "zod";
import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { apiErrorFromDbError } from "@/lib/api/db-errors";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { SupplierUpdateSchema } from "@/lib/validations/supply-chain";

const SupplierIdParamSchema = z.object({
  supplierId: z.string().uuid("Invalid supplier id."),
});

interface SupplierRecord {
  id: string;
  name: string;
  region_code: string | null;
  criticality: number;
  is_active: boolean;
  created_at: string;
}

function toSupplierDto(record: SupplierRecord) {
  return {
    createdAt: record.created_at,
    criticality: record.criticality,
    id: record.id,
    isActive: record.is_active,
    name: record.name,
    regionCode: record.region_code,
  };
}

function parseSupplierId(params: { supplierId: string }) {
  return SupplierIdParamSchema.safeParse(params);
}

interface SupplierRouteContext {
  params: Promise<{ supplierId: string }>;
}

export async function GET(_request: Request, { params }: SupplierRouteContext) {
  const paramParsed = parseSupplierId(await params);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "SUPPLIER_PATH_VALIDATION_ERROR",
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

  const { organizationId, supabase } = contextResult.context;

  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name, region_code, criticality, is_active, created_at")
    .eq("organization_id", organizationId)
    .eq("id", paramParsed.data.supplierId)
    .maybeSingle();

  if (error) {
    return apiError(
      {
        code: "SUPPLIER_LOOKUP_FAILED",
        message: error.message || "Failed to lookup supplier.",
      },
      500,
    );
  }

  if (!data) {
    return apiError(
      {
        code: "SUPPLIER_NOT_FOUND",
        message: "Supplier not found.",
      },
      404,
    );
  }

  return apiSuccess(toSupplierDto(data as SupplierRecord));
}

export async function PATCH(request: Request, { params }: SupplierRouteContext) {
  const paramParsed = parseSupplierId(await params);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "SUPPLIER_PATH_VALIDATION_ERROR",
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

  const body = await readJsonBody(request);
  const parsed = SupplierUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "SUPPLIER_VALIDATION_ERROR",
        message: "Invalid supplier update payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;

  const updatePayload: {
    criticality?: number;
    is_active?: boolean;
    name?: string;
    region_code?: string | null;
  } = {};

  if (parsed.data.name !== undefined) {
    updatePayload.name = parsed.data.name;
  }

  if (parsed.data.regionCode !== undefined) {
    updatePayload.region_code = parsed.data.regionCode ?? null;
  }

  if (parsed.data.criticality !== undefined) {
    updatePayload.criticality = parsed.data.criticality;
  }

  if (parsed.data.isActive !== undefined) {
    updatePayload.is_active = parsed.data.isActive;
  }

  const { data, error } = await supabase
    .from("suppliers")
    .update(updatePayload)
    .eq("organization_id", organizationId)
    .eq("id", paramParsed.data.supplierId)
    .select("id, name, region_code, criticality, is_active, created_at")
    .maybeSingle();

  if (error) {
    return apiErrorFromDbError(error, {
      conflictCode: "SUPPLIER_CONFLICT",
      conflictMessage: "A supplier with this name already exists in your organization.",
      defaultCode: "SUPPLIER_UPDATE_FAILED",
      defaultMessage: "Failed to update supplier.",
    });
  }

  if (!data) {
    return apiError(
      {
        code: "SUPPLIER_NOT_FOUND",
        message: "Supplier not found.",
      },
      404,
    );
  }

  return apiSuccess(toSupplierDto(data as SupplierRecord));
}

export async function DELETE(_request: Request, { params }: SupplierRouteContext) {
  const paramParsed = parseSupplierId(await params);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "SUPPLIER_PATH_VALIDATION_ERROR",
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

  const { organizationId, supabase } = contextResult.context;

  const { data, error } = await supabase
    .from("suppliers")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", paramParsed.data.supplierId)
    .select("id")
    .maybeSingle();

  if (error) {
    return apiErrorFromDbError(error, {
      conflictCode: "SUPPLIER_DELETE_CONFLICT",
      conflictMessage:
        "Supplier cannot be deleted because it is referenced by facilities, parts, or events.",
      defaultCode: "SUPPLIER_DELETE_FAILED",
      defaultMessage: "Failed to delete supplier.",
      foreignKeyCode: "SUPPLIER_DELETE_CONFLICT",
      foreignKeyMessage:
        "Supplier cannot be deleted because it is referenced by facilities, parts, or events.",
    });
  }

  if (!data) {
    return apiError(
      {
        code: "SUPPLIER_NOT_FOUND",
        message: "Supplier not found.",
      },
      404,
    );
  }

  return apiSuccess({ deleted: true, supplierId: paramParsed.data.supplierId });
}
