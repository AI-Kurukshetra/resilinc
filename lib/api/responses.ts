import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export interface ApiErrorPayload {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  retryAfterSeconds?: number;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiErrorPayload;
}

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiError(
  payload: ApiErrorPayload,
  status: number,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ ok: false, error: payload }, { status });
}

export function zodFieldErrors(error: ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors;
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
