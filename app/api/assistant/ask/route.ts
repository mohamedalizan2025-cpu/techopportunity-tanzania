import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/assistant/rate-limit";
import { fallbackPlan, parseAssistantPlan, appliedFilters } from "@/lib/assistant/plan";
import { interpretQuestion, isProviderConfigured, ProviderNotConfiguredError } from "@/lib/assistant/provider";
import { executeAssistantPlan } from "@/lib/data/assistant-queries";

const MAX_QUESTION_LENGTH = 200;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "local";
}

export async function POST(request: Request) {
  // Kill switch (server-only env). Default: disabled.
  if (process.env.ASSISTANT_ENABLED !== "true") {
    return NextResponse.json({
      mode: "disabled",
      summary: "The AI assistant is not enabled yet. Use the search and filters to browse published opportunities.",
      appliedFilters: null,
      results: [],
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ mode: "error", summary: "Invalid request body.", results: [] }, { status: 400 });
  }

  const question =
    body && typeof body === "object" && typeof (body as { question?: unknown }).question === "string"
      ? (body as { question: string }).question.trim()
      : "";

  if (question.length < 2) {
    return NextResponse.json({ mode: "error", summary: "Please enter a longer question.", results: [] }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ mode: "error", summary: "Questions are limited to 200 characters.", results: [] }, { status: 400 });
  }

  const limit = checkRateLimit(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { mode: "rate-limited", summary: `Too many requests. Try again in ${limit.retryAfterSeconds} seconds.`, results: [] },
      { status: 429 }
    );
  }

  // Interpretation: provider only when configured AND enabled; otherwise the
  // deterministic fallback plan. The provider never sees database content.
  let plan;
  let mode: "ai" | "deterministic" = "deterministic";
  if (!isProviderConfigured()) {
    plan = fallbackPlan(question);
  } else {
    try {
      const rawPlan = await interpretQuestion(question);
      plan = parseAssistantPlan(rawPlan);
      mode = "ai";
    } catch (error) {
      if (!(error instanceof ProviderNotConfiguredError)) {
        console.error("[assistant] provider interpretation failed; using fallback");
      }
      plan = fallbackPlan(question);
    }
  }

  // Grounded execution: published-only reads through lib/data/*.
  const answer = await executeAssistantPlan(plan);

  return NextResponse.json({
    mode,
    summary: answer.summary,
    appliedFilters: appliedFilters(plan),
    results: answer.results,
  });
}
