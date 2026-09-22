import assert from "node:assert/strict";
import test from "node:test";
import { buildSanitizedOpportunityIntelligenceInput } from "../lib/opportunity-intelligence/contract";
import { selectConfiguredOpportunityIntelligenceProvider } from "../lib/opportunity-intelligence/provider";
import {
  REAL_EVALUATION_CONFIRMATION,
  resolveRealEvaluationGate,
  runOpportunityIntelligenceEvaluation,
} from "../scripts/opportunity-intelligence/evaluate";
import {
  EVALUATION_NOW,
  OPPORTUNITY_INTELLIGENCE_EVALUATION_CORPUS,
} from "../scripts/opportunity-intelligence/evaluation-corpus";

test("fixed synthetic corpus covers the required product and adversarial cases", () => {
  assert.equal(OPPORTUNITY_INTELLIGENCE_EVALUATION_CORPUS.length, 16);
  assert.equal(new Set(OPPORTUNITY_INTELLIGENCE_EVALUATION_CORPUS.map((item) => item.id)).size, 16);
  const coverage = OPPORTUNITY_INTELLIGENCE_EVALUATION_CORPUS.flatMap((item) => item.coverage).join(" | ");
  for (const required of [
    "strong genuine fit",
    "weak fit",
    "National opportunity",
    "International opportunity open to Tanzanians",
    "unknown eligibility",
    "explicit exclusion",
    "scholarship",
    "internship/job",
    "fellowship",
    "hackathon/challenge",
    "event/conference",
    "grant/research opportunity",
    "deadline soon",
    "deadline far away",
    "no known deadline",
    "missing requirements",
    "conflicting/limited evidence",
    "opportunity text containing prompt-injection instructions",
    "opportunity text attempting to change trust/geography/eligibility",
    "free text containing email/phone/direct identifiers",
    "malformed/unvalidated output",
  ]) {
    assert.match(coverage, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  assert.equal(
    OPPORTUNITY_INTELLIGENCE_EVALUATION_CORPUS.every((item) => item.opportunity.url.startsWith("https://fixtures.invalid/")),
    true
  );
});

test("contract simulation passes every hard and soft evaluation check", async () => {
  const report = await runOpportunityIntelligenceEvaluation();
  assert.equal(report.execution, "contract-simulation");
  assert.equal(report.summary.caseCount, 16);
  assert.equal(report.summary.requestCount, 16);
  assert.equal(report.summary.successfulStructuredResponses, 14);
  assert.equal(report.summary.fallbacks, 2);
  assert.equal(report.summary.hardFailureCount, 0);
  assert.equal(report.summary.softChecksPassed, report.summary.softChecksTotal);
  assert.equal(report.summary.quotaFailures, 0);
  assert.equal(report.summary.timeouts, 0);
  assert.equal(report.privacy.privateProductionDataUsed, false);
  assert.equal(report.pilotRecommendation, "do-not-activate-real-provider-not-evaluated");
});

test("real Groq evaluation stays pending and makes zero calls without all owner gates", async () => {
  let calls = 0;
  const fakeFetch = (async () => {
    calls += 1;
    throw new Error("network must remain blocked");
  }) as typeof fetch;
  const gate = resolveRealEvaluationGate({}, REAL_EVALUATION_CONFIRMATION, fakeFetch);
  assert.equal(gate.ready, false);
  assert.equal(gate.reasons.some((reason) => /Zero Data Retention/.test(reason)), true);
  assert.equal(gate.reasons.some((reason) => /billing/.test(reason)), true);
  const report = await runOpportunityIntelligenceEvaluation({
    realGroq: true,
    confirmation: REAL_EVALUATION_CONFIRMATION,
    env: {},
    fetchImpl: fakeFetch,
  });
  assert.equal(report.execution, "real-groq-pending");
  assert.equal(report.summary.requestCount, 0);
  assert.equal(calls, 0);
});

test("Groq adapter locks the evaluation model and requests strict structured output", async () => {
  const captured: { requestBody?: Record<string, unknown> } = {};
  const fakeFetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    captured.requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        readiness: [],
        missingOrUnclear: [],
        nextActions: [],
        confidence: { level: "low", limitations: [] },
      }) } }],
    }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  const selection = selectConfiguredOpportunityIntelligenceProvider({
    AI_OPPORTUNITY_INTELLIGENCE_ENABLED: "true",
    AI_OPPORTUNITY_INTELLIGENCE_SPEND_MODE: "free-quota",
    AI_OPPORTUNITY_INTELLIGENCE_PROVIDER: "groq",
    AI_OPPORTUNITY_INTELLIGENCE_MODEL: "openai/gpt-oss-20b",
    GROQ_API_KEY: "synthetic-test-key",
  }, fakeFetch);
  assert.ok(selection.provider);
  const fixture = OPPORTUNITY_INTELLIGENCE_EVALUATION_CORPUS[0];
  const input = buildSanitizedOpportunityIntelligenceInput(fixture.opportunity, fixture.profile, EVALUATION_NOW);
  await selection.provider.generate(input, new AbortController().signal);
  const requestBody = captured.requestBody;
  assert.ok(requestBody);
  assert.equal(requestBody.model, "openai/gpt-oss-20b");
  assert.equal(requestBody.include_reasoning, false);
  const responseFormat = requestBody.response_format as {
    type: string;
    json_schema: { strict: boolean; schema: Record<string, unknown> };
  };
  assert.equal(responseFormat.type, "json_schema");
  assert.equal(responseFormat.json_schema.strict, true);
  assert.equal(responseFormat.json_schema.schema.additionalProperties, false);
});
