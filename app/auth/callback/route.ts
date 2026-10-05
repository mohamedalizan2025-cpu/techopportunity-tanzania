import { NextResponse, type NextRequest } from "next/server";
import { resolveSiteOrigin } from "@/lib/auth-redirect";
import { createSupabaseAuthServerClient } from "@/lib/data/supabase-auth";
import { postLoginDestination, sanitizeNextPath } from "@/lib/staff-form-state";

const RECOVERY_DESTINATION = "/reset-password";

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

function confirmationFailure(nextPath: string): NextResponse {
  return canonicalRedirect(
    `/login?authError=confirmation&next=${encodeURIComponent(nextPath)}`
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  const isRecovery = type === "recovery";
  // A recovery link must always land on the reset page: the caller-supplied
  // `next` value is ignored for `type=recovery` so a recovery email can
  // never be repurposed as an open redirect.
  const nextPath = isRecovery
    ? RECOVERY_DESTINATION
    : postLoginDestination(sanitizeNextPath(params.get("next")), false);
  const code = params.get("code");
  const tokenHash = params.get("token_hash");

  if (!code && !tokenHash) {
    if (isRecovery) return canonicalRedirect(RECOVERY_DESTINATION);
    return confirmationFailure(nextPath);
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return canonicalRedirect(nextPath);
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as
          | "signup"
          | "invite"
          | "magiclink"
          | "recovery"
          | "email_change"
          | "email",
      });
      if (!error) return canonicalRedirect(nextPath);
    }
  } catch {}

  if (isRecovery) return canonicalRedirect(RECOVERY_DESTINATION);
  return confirmationFailure(nextPath);
}
