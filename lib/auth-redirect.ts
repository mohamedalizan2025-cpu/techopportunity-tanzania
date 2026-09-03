import { postLoginDestination, sanitizeNextPath } from "./staff-form-state";

export interface AuthRedirectEnvironment {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_URL?: string;
  NODE_ENV?: string;
}

function normalizeExplicitOrigin(
  value: string | undefined,
  allowLocalHttp: boolean
): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    const isLocalHttp =
      allowLocalHttp &&
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    if (url.protocol !== "https:" && !isLocalHttp) return null;
    if (url.username || url.password || url.search || url.hash) return null;
    if (url.pathname !== "/") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function normalizeVercelHost(value: string | undefined): string | null {
  const host = value?.trim();
  if (!host || /[\s/@?#\\]/.test(host)) return null;
  return normalizeExplicitOrigin(`https://${host}`, false);
}

/**
 * Resolve a canonical application origin without trusting request headers.
 * An explicitly configured but invalid URL fails closed instead of silently
 * falling through to a different deployment.
 */
export function resolveSiteOrigin(
  environment: AuthRedirectEnvironment = process.env
): string | null {
  const allowLocalHttp = environment.NODE_ENV !== "production";
  if (environment.NEXT_PUBLIC_SITE_URL?.trim()) {
    return normalizeExplicitOrigin(
      environment.NEXT_PUBLIC_SITE_URL,
      allowLocalHttp
    );
  }

  const productionOrigin = normalizeVercelHost(
    environment.VERCEL_PROJECT_PRODUCTION_URL
  );
  if (productionOrigin) return productionOrigin;

  const deploymentOrigin = normalizeVercelHost(environment.VERCEL_URL);
  if (deploymentOrigin) return deploymentOrigin;

  return allowLocalHttp ? "http://localhost:3000" : null;
}

export function buildAuthCallbackUrl(
  requestedNext: unknown,
  environment: AuthRedirectEnvironment = process.env
): string | null {
  const origin = resolveSiteOrigin(environment);
  if (!origin) return null;

  const safeNext = postLoginDestination(
    sanitizeNextPath(requestedNext),
    false
  );
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", safeNext);
  return callback.toString();
}
