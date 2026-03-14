import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type HealthPayload = {
  status: "ok" | "degraded";
  timestamp: string;
  checks: {
    requiredEnv: {
      NEXT_PUBLIC_SUPABASE_URL: boolean;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean;
    };
  };
};

export async function GET() {
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const payload: HealthPayload = {
    status: hasSupabaseUrl && hasSupabaseAnonKey ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks: {
      requiredEnv: {
        NEXT_PUBLIC_SUPABASE_URL: hasSupabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: hasSupabaseAnonKey,
      },
    },
  };

  const statusCode = payload.status === "ok" ? 200 : 503;

  return NextResponse.json(payload, { status: statusCode });
}
