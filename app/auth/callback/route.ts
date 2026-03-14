import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sanitizeNextPath } from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const VALID_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email",
  "email_change",
];

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = sanitizeNextPath(requestUrl.searchParams.get("next") ?? undefined, "/login");
  const supabase = await createServerSupabaseClient();

  let hasError = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    hasError = Boolean(error);
  } else if (tokenHash && type && isValidEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    hasError = Boolean(error);
  } else {
    hasError = true;
  }

  const redirectUrl = new URL(next, requestUrl.origin);

  if (hasError) {
    redirectUrl.searchParams.set("error", "1");
  }

  return NextResponse.redirect(redirectUrl);
}

function isValidEmailOtpType(type: string): type is EmailOtpType {
  return VALID_OTP_TYPES.includes(type as EmailOtpType);
}
