import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getOpportunityBySlug } from "@/lib/data/opportunities";
import { getTalentProfile } from "@/lib/data/talent-profile";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";
import { isAiSearchableOpportunity } from "@/lib/opportunity-trust";
import { buildMatchingInput } from "@/lib/personalization";
import { checkOpportunityInsightRateLimit } from "@/lib/opportunity-intelligence/rate-limit";
import { generateOpportunityInsight } from "@/lib/opportunity-intelligence/service";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_REQUEST_BYTES = 2_048;
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: PRIVATE_HEADERS });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return json({ error: "Sign in to use Opportunity Insight." }, { status: 401 });
  }

  let body: unknown;
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_REQUEST_BYTES) {
    return json({ error: "Request is too large." }, { status: 413 });
  }
  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_REQUEST_BYTES) {
      return json({ error: "Request is too large." }, { status: 413 });
    }
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }
  const slug = body && typeof body === "object" && typeof (body as { slug?: unknown }).slug === "string"
    ? (body as { slug: string }).slug.trim()
    : "";
  if (slug.length === 0 || slug.length > 160 || !SLUG.test(slug)) {
    return json({ error: "Invalid opportunity." }, { status: 400 });
  }

  const rateKey = createHash("sha256").update(user.userId).digest("hex");
  const limit = checkOpportunityInsightRateLimit(rateKey);
  if (!limit.allowed) {
    return json(
      { error: `Too many requests. Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429 }
    );
  }

  const [opportunity, profileResult] = await Promise.all([
    getOpportunityBySlug(slug),
    getTalentProfile(user),
  ]);
  if (!opportunity) return json({ error: "Opportunity not found." }, { status: 404 });
  if (!isAiSearchableOpportunity(opportunity)) {
    return json(
      { error: "Opportunity Insight is available only for active opportunities with complete verified evidence." },
      { status: 409 }
    );
  }

  const insight = await generateOpportunityInsight(
    opportunity,
    buildMatchingInput(profileResult.profile)
  );
  return json({ insight });
}
