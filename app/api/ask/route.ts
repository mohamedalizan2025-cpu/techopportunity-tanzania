import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { answerAsk } from "@/lib/ask/service";
import { getPublicBrowseData } from "@/lib/data/opportunities";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";
import { checkOpportunityInsightRateLimit } from "@/lib/opportunity-intelligence/rate-limit";
import { ASK_QUESTION_MAX_LENGTH } from "@/lib/ask/contract";

const MAX_REQUEST_BYTES = 2_048;
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: PRIVATE_HEADERS });
}

/**
 * Ask Tech Opportunity answers. Custom questions require sign-in so the
 * existing user-scoped rate limit and abuse controls apply; nothing is
 * ever persisted. Suggested help answers are served deterministically
 * on the public /ask page with no account needed.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return json({ error: "Sign in to ask a custom question." }, { status: 401 });
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
  const question =
    body && typeof body === "object" && typeof (body as { question?: unknown }).question === "string"
      ? (body as { question: string }).question
      : "";
  if (question.trim().length === 0 || question.length > ASK_QUESTION_MAX_LENGTH + 100) {
    return json({ error: "Ask a question between 4 and 500 characters." }, { status: 400 });
  }

  const rateKey = createHash("sha256").update(`ask:${user.userId}`).digest("hex");
  const limit = checkOpportunityInsightRateLimit(rateKey);
  if (!limit.allowed) {
    return json(
      { error: `Too many requests. Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429 }
    );
  }

  const browse = await getPublicBrowseData({});
  const answer = await answerAsk(question, browse.opportunities);
  return json({ answer });
}
