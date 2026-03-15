import { apiError, apiSuccess, zodFieldErrors } from "@/lib/api/responses";
import { requireOrgApiContext } from "@/lib/api/org-context";
import { ComplianceServiceError, createItem, listItems } from "@/lib/compliance/service";
import {
  ComplianceItemCreateSchema,
  ComplianceItemListQuerySchema,
  FrameworkIdParamSchema,
} from "@/lib/validations/compliance";

interface Params {
  params: Promise<{ frameworkId: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { frameworkId } = await params;
  if (!FrameworkIdParamSchema.safeParse({ frameworkId }).success) {
    return apiError({ code: "INVALID_FRAMEWORK_ID", message: "Invalid framework ID." }, 400);
  }

  const qParams = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = ComplianceItemListQuerySchema.safeParse(qParams);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid query.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const data = await listItems(supabase, organizationId, frameworkId, parsed.data);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ComplianceServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "ITEM_LIST_FAILED", message: "Unexpected error listing items." }, 500);
  }
}

export async function POST(request: Request, { params }: Params) {
  const contextResult = await requireOrgApiContext();
  if (contextResult.errorResponse) return contextResult.errorResponse;

  const { frameworkId } = await params;
  if (!FrameworkIdParamSchema.safeParse({ frameworkId }).success) {
    return apiError({ code: "INVALID_FRAMEWORK_ID", message: "Invalid framework ID." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  const parsed = ComplianceItemCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid item data.", fieldErrors: zodFieldErrors(parsed.error) },
      400,
    );
  }

  const { organizationId, supabase } = contextResult.context;
  try {
    const item = await createItem(supabase, organizationId, frameworkId, parsed.data);
    return apiSuccess(item, 201);
  } catch (error) {
    if (error instanceof ComplianceServiceError) {
      return apiError({ code: error.code, message: error.message }, error.status);
    }
    return apiError({ code: "ITEM_CREATE_FAILED", message: "Unexpected error creating item." }, 500);
  }
}
