import { apiError, apiSuccess, readJsonBody, zodFieldErrors } from "@/lib/api/responses";
import { apiErrorFromDbError } from "@/lib/api/db-errors";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { PartCreateSchema, PartListQuerySchema } from "@/lib/validations/supply-chain";

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

export async function GET(request: Request) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) {
    return contextResult.errorResponse;
  }

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const queryParsed = PartListQuerySchema.safeParse(params);

  if (!queryParsed.success) {
    return apiError(
      {
        code: "PART_QUERY_VALIDATION_ERROR",
        message: "Invalid part list query parameters.",
        fieldErrors: zodFieldErrors(queryParsed.error),
      },
      400,
    );
  }

  const { limit, offset, search, supplierId } = queryParsed.data;
  const { organizationId, supabase } = contextResult.context;

  if (supplierId) {
    const { data: links, error: linksError } = await supabase
      .from("supplier_parts")
      .select("part_id")
      .eq("organization_id", organizationId)
      .eq("supplier_id", supplierId);

    if (linksError) {
      return apiError(
        {
          code: "PART_LIST_FAILED",
          message: linksError.message || "Failed to list parts for supplier.",
        },
        500,
      );
    }

    const partIds = [...new Set((links ?? []).map((row) => row.part_id as string))];

    if (partIds.length === 0) {
      return apiSuccess({
        items: [],
        pagination: {
          limit,
          offset,
          total: 0,
        },
      });
    }

    let filteredQuery = supabase
      .from("parts")
      .select("id, part_number, description, criticality, created_at")
      .eq("organization_id", organizationId)
      .in("id", partIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      filteredQuery = filteredQuery.ilike("part_number", `%${search}%`);
    }

    const { data, error } = await filteredQuery;

    if (error) {
      return apiError(
        {
          code: "PART_LIST_FAILED",
          message: error.message || "Failed to list parts.",
        },
        500,
      );
    }

    const items = (data as PartRecord[] | null)?.map(toPartDto) ?? [];

    return apiSuccess({
      items,
      pagination: {
        limit,
        offset,
        total: partIds.length,
      },
    });
  }

  let dbQuery = supabase
    .from("parts")
    .select("id, part_number, description, criticality, created_at", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    dbQuery = dbQuery.or(`part_number.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, count, error } = await dbQuery;

  if (error) {
    return apiError(
      {
        code: "PART_LIST_FAILED",
        message: error.message || "Failed to list parts.",
      },
      500,
    );
  }

  const items = (data as PartRecord[] | null)?.map(toPartDto) ?? [];

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
  const parsed = PartCreateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      {
        code: "PART_VALIDATION_ERROR",
        message: "Invalid part payload.",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;

  const { data, error } = await supabase
    .from("parts")
    .insert({
      organization_id: organizationId,
      part_number: parsed.data.partNumber,
      description: parsed.data.description ?? null,
      criticality: parsed.data.criticality,
    })
    .select("id, part_number, description, criticality, created_at")
    .single();

  if (error) {
    return apiErrorFromDbError(error, {
      conflictCode: "PART_CONFLICT",
      conflictMessage: "Part number already exists in your organization.",
      defaultCode: "PART_CREATE_FAILED",
      defaultMessage: "Failed to create part.",
    });
  }

  return apiSuccess(toPartDto(data as PartRecord), 201);
}
