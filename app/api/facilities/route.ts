import type { SupabaseClient } from "@supabase/supabase-js";
import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { apiErrorFromDbError } from "@/lib/api/db-errors";
import { requireOrgApiContext } from "@/lib/api/org-context";
import {
  FacilityCreateSchema,
  FacilityListQuerySchema,
} from "@/lib/validations/supply-chain";

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

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const queryParsed = FacilityListQuerySchema.safeParse(params);

  if (!queryParsed.success) {
    return apiError(
      {
        code: "FACILITY_QUERY_VALIDATION_ERROR",
        message: "Invalid facility list query parameters.",
        fieldErrors: zodFieldErrors(queryParsed.error),
      },
      400,
    );
  }

  const { limit, offset, search, supplierId } = queryParsed.data;
  const { organizationId, supabase } = contextResult.context;

  let dbQuery = supabase
    .from("facilities")
    .select("id, name, supplier_id, country_code, latitude, longitude, created_at", {
      count: "exact",
    })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (supplierId) {
    dbQuery = dbQuery.eq("supplier_id", supplierId);
  }

  if (search) {
    dbQuery = dbQuery.ilike("name", `%${search}%`);
  }

  const { data, count, error } = await dbQuery;

  if (error) {
    return apiError(
      {
        code: "FACILITY_LIST_FAILED",
        message: error.message || "Failed to list facilities.",
      },
      500,
    );
  }

  const items = (data as FacilityRecord[] | null)?.map(toFacilityDto) ?? [];

  return apiSuccess({
    items,
    pagination: {
      limit,
      offset,
      total: count ?? items.length,
    },
  });
}

export async function POST(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const body = await readJsonBody(request);
  const parsed = FacilityCreateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "FACILITY_VALIDATION_ERROR",
        message: "Invalid facility payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
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

  const { data, error } = await supabase
    .from("facilities")
    .insert({
      organization_id: organizationId,
      supplier_id: parsed.data.supplierId,
      name: parsed.data.name,
      country_code: parsed.data.countryCode ?? null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
    })
    .select("id, name, supplier_id, country_code, latitude, longitude, created_at")
    .single();

  if (error) {
    return apiErrorFromDbError(error, {
      conflictCode: "FACILITY_CONFLICT",
      conflictMessage: "A facility with this name already exists for the supplier.",
      defaultCode: "FACILITY_CREATE_FAILED",
      defaultMessage: "Failed to create facility.",
      foreignKeyCode: "FACILITY_SUPPLIER_NOT_FOUND",
      foreignKeyMessage: "Supplier does not exist in this organization.",
    });
  }

  return apiSuccess(toFacilityDto(data as FacilityRecord), 201);
}
