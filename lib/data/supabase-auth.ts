import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export async function createSupabaseAuthServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "[lib/data] Supabase auth client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {}
      },
    },
  });
}

export interface AuthenticatedUserContext {
  client: Awaited<ReturnType<typeof createSupabaseAuthServerClient>>;
  userId: string;
  email: string | null;
  displayName: string | null;
  role: "user" | "moderator" | "admin";
}

/**
 * Request-scoped authenticated identity. Claims establish identity; the user's
 * own RLS-protected profile supplies display and staff-role information.
 */
export const getAuthenticatedUser = cache(
  async (): Promise<AuthenticatedUserContext | null> => {
    let client;
    try {
      client = await createSupabaseAuthServerClient();
    } catch {
      return null;
    }

    const { data: claimsData, error: claimsError } = await client.auth.getClaims();
    const claims = claimsError ? null : (claimsData?.claims ?? null);
    const userId = (claims?.sub as string | undefined) ?? null;
    if (!userId) return null;

    const { data: profile } = await client
      .from("profiles")
      .select("display_name,role")
      .eq("id", userId)
      .maybeSingle();
    const row = profile as unknown as {
      display_name: string | null;
      role: string;
    } | null;
    const role =
      row?.role === "moderator" || row?.role === "admin" ? row.role : "user";

    return {
      client,
      userId,
      email: (claims?.email as string | undefined) ?? null,
      displayName: row?.display_name?.trim() || null,
      role,
    };
  }
);
