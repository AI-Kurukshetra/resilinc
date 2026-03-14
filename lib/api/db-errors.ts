import type { PostgrestError } from "@supabase/supabase-js";
import { apiError } from "@/lib/api/responses";

interface DbErrorOptions {
  conflictCode: string;
  conflictMessage: string;
  defaultCode: string;
  defaultMessage: string;
  foreignKeyCode?: string;
  foreignKeyMessage?: string;
}

export function apiErrorFromDbError(error: PostgrestError, options: DbErrorOptions) {
  if (error.code === "23505") {
    return apiError(
      {
        code: options.conflictCode,
        message: options.conflictMessage,
      },
      409,
    );
  }

  if (error.code === "23503" && options.foreignKeyCode && options.foreignKeyMessage) {
    return apiError(
      {
        code: options.foreignKeyCode,
        message: options.foreignKeyMessage,
      },
      409,
    );
  }

  return apiError(
    {
      code: options.defaultCode,
      message: error.message || options.defaultMessage,
    },
    500,
  );
}
