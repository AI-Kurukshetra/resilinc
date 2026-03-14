import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { apiErrorFromDbError } from "@/lib/api/db-errors";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { FacilityUpdateSchema } from "@/lib/validations/supply-chain";

const FacilityIdParamSchema = z.object({
  facilityId: z.string().uuid("Invalid facility id."),
});

interface FacilityRecord {
  id: string;
  name: string;
  supplier_id: string;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

function toFacilityDto(record: FacilityRecord) {
  return {
    countryCode: record.country_code,
    createdAt: record.created_at,
    facilityId: record.id,
    latitude: record.latitude,
    longitude: record.longitude,
    name: record.name,
    supplierId: record.supplier_id,
  };
}

async function supplierExistsInOrg(
  supabase: SupabaseClient,
  organizationId: string,
  supplierId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", supplierId)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data?.id);
}

function parseFacilityId(params: { facilityId: string }) {
  return FacilityIdParamSchema.safeParse(params);
}

interface FacilityRouteContext {
  params: Promise<{ facilityId: string }>;
}

export async function GET(_request: Request, { params }: FacilityRouteContext) {
  const paramParsed = parseFacilityId(await params);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "FACILITY_PATH_VALIDATION_ERROR",
        message: "Invalid facility id.",
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
    .from("facilities")
    .select("id, name, supplier_id, country_code, latitude, longitude, created_at")
    .eq("organization_id", organizationId)
    .eq("id", paramParsed.data.facilityId)
    .maybeSingle();

  if (error) {
    return apiError(
      {
        code: "FACILITY_LOOKUP_FAILED",
        message: error.message || "Failed to lookup facility.",
      },
      500,
    );
  }

  if (!data) {
    return apiError(
      {
        code: "FACILITY_NOT_FOUND",
        message: "Facility not found.",
      },
      404,
    );
  }

  return apiSuccess(toFacilityDto(data as FacilityRecord));
}

export async function PATCH(request: Request, { params }: FacilityRouteContext) {
  const paramParsed = parseFacilityId(await params);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "FACILITY_PATH_VALIDATION_ERROR",
        message: "Invalid facility id.",
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
  const parsed = FacilityUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "FACILITY_VALIDATION_ERROR",
        message: "Invalid facility update payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;

  if (parsed.data.supplierId) {
    const supplierExists = await supplierExistsInOrg(supabase, organizationId, parsed.data.supplierId);

    if (!supplierExists) {
      return apiError(
        {
          code: "FACILITY_SUPPLIER_NOT_FOUND",
          message: "Supplier does not exist in this organization.",
        },
        404,
      );
    }
  }

  const updatePayload: {
    supplier_id?: string;
    name?: string;
    country_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } = {};

  if (parsed.data.supplierId !== undefined) {
    updatePayload.supplier_id = parsed.data.supplierId;
  }

  if (parsed.data.name !== undefined) {
    updatePayload.name = parsed.data.name;
  }

  if (parsed.data.countryCode !== undefined) {
    updatePayload.country_code = parsed.data.countryCode ?? null;
  }

  if (parsed.data.latitude !== undefined) {
    updatePayload.latitude = parsed.data.latitude ?? null;
  }

  if (parsed.data.longitude !== undefined) {
    updatePayload.longitude = parsed.data.longitude ?? null;
  }

  const { data, error } = await supabase
    .from("facilities")
    .update(updatePayload)
    .eq("organization_id", organizationId)
    .eq("id", paramParsed.data.facilityId)
    .select("id, name, supplier_id, country_code, latitude, longitude, created_at")
    .maybeSingle();

  if (error) {
    return apiErrorFromDbError(error, {
      conflictCode: "FACILITY_CONFLICT",
      conflictMessage: "A facility with this name already exists for the supplier.",
      defaultCode: "FACILITY_UPDATE_FAILED",
      defaultMessage: "Failed to update facility.",
      foreignKeyCode: "FACILITY_SUPPLIER_NOT_FOUND",
      foreignKeyMessage: "Supplier does not exist in this organization.",
    });
  }

  if (!data) {
    return apiError(
      {
        code: "FACILITY_NOT_FOUND",
        message: "Facility not found.",
      },
      404,
    );
  }

  return apiSuccess(toFacilityDto(data as FacilityRecord));
}

export async function DELETE(_request: Request, { params }: FacilityRouteContext) {
  const paramParsed = parseFacilityId(await params);

  if (!paramParsed.success) {
    return apiError(
      {
        code: "FACILITY_PATH_VALIDATION_ERROR",
        message: "Invalid facility id.",
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
    .from("facilities")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", paramParsed.data.facilityId)
    .select("id")
    .maybeSingle();

  if (error) {
    return apiError(
      {
        code: "FACILITY_DELETE_FAILED",
        message: error.message || "Failed to delete facility.",
      },
      500,
    );
  }

  if (!data) {
    return apiError(
      {
        code: "FACILITY_NOT_FOUND",
        message: "Facility not found.",
      },
      404,
    );
  }

  return apiSuccess({ deleted: true, facilityId: paramParsed.data.facilityId });
}
