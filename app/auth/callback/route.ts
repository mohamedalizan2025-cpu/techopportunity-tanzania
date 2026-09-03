import { NextResponse, type NextRequest } from "next/server";
import { resolveSiteOrigin } from "@/lib/auth-redirect";
import { createSupabaseAuthServerClient } from "@/lib/data/supabase-auth";
import { postLoginDestination, sanitizeNextPath } from "@/lib/staff-form-state";

function destination(request: NextRequest): string {
  return postLoginDestination(
    sanitizeNextPath(request.nextUrl.searchParams.get("next")),
    false
  );
}

function canonicalRedirect(path: string): NextResponse {
  const origin = resolveSiteOrigin();
  if (!origin) {
    return NextResponse.json(
      { message: "Authentication redirect is not configured." },
      { status: 503 }
    );
  }
  return NextResponse.redirect(new URL(path, origin));
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const nextPath = destination(request);
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return canonicalRedirect(
      `/login?authError=confirmation&next=${encodeURIComponent(nextPath)}`
    );
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return canonicalRedirect(nextPath);
  } catch {}

  return canonicalRedirect(
    `/login?authError=confirmation&next=${encodeURIComponent(nextPath)}`
  );
}
