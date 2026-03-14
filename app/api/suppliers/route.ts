import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { apiErrorFromDbError } from "@/lib/api/db-errors";
import { requireOrgApiContext } from "@/lib/api/org-context";
import {
  SupplierCreateSchema,
  SupplierListQuerySchema,
} from "@/lib/validations/supply-chain";

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

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const queryParsed = SupplierListQuerySchema.safeParse(params);

  if (!queryParsed.success) {
    return apiError(
      {
        code: "SUPPLIER_QUERY_VALIDATION_ERROR",
        message: "Invalid supplier list query parameters.",
        fieldErrors: zodFieldErrors(queryParsed.error),
      },
      400,
    );
  }

  const { limit, offset, search } = queryParsed.data;
  const { organizationId, supabase } = contextResult.context;

  let dbQuery = supabase
    .from("suppliers")
    .select("id, name, region_code, criticality, is_active, created_at", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    dbQuery = dbQuery.ilike("name", `%${search}%`);
  }

  const { data, count, error } = await dbQuery;

  if (error) {
    return apiError(
      {
        code: "SUPPLIER_LIST_FAILED",
        message: error.message || "Failed to list suppliers.",
      },
      500,
    );
  }

  const items = (data as SupplierRecord[] | null)?.map(toSupplierDto) ?? [];

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
  const parsed = SupplierCreateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "SUPPLIER_VALIDATION_ERROR",
        message: "Invalid supplier payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      organization_id: organizationId,
      name: parsed.data.name,
      region_code: parsed.data.regionCode ?? null,
      criticality: parsed.data.criticality,
      is_active: parsed.data.isActive,
    })
    .select("id, name, region_code, criticality, is_active, created_at")
    .single();

  if (error) {
    return apiErrorFromDbError(error, {
      conflictCode: "SUPPLIER_CONFLICT",
      conflictMessage: "A supplier with this name already exists in your organization.",
      defaultCode: "SUPPLIER_CREATE_FAILED",
      defaultMessage: "Failed to create supplier.",
    });
  }

  return apiSuccess(toSupplierDto(data as SupplierRecord), 201);
}
