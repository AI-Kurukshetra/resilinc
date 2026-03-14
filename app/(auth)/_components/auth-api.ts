import type { ApiErrorPayload } from "@/lib/api/responses";

interface SuccessResponse<T> {
  ok: true;
  data: T;
}

interface ErrorResponse {
  ok: false;
  error: ApiErrorPayload;
}

type AuthApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export async function postAuth<T>(
  endpoint: string,
  payload: unknown,
): Promise<AuthApiResponse<T>> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json: unknown = await response.json().catch(() => null);

  if (!json || typeof json !== "object" || !("ok" in json)) {
    return {
      ok: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "Server returned an invalid response",
      },
    };
  }

  return json as AuthApiResponse<T>;
}
