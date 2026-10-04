import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import {
  buildDeterministicOpportunityInsight,
  buildSanitizedOpportunityIntelligenceInput,
  type InsightItem,
  type ModelOpportunityAssistance,
  type OpportunityInsight,
} from "../../lib/opportunity-intelligence/contract";
import {
  createMockOpportunityIntelligenceProvider,
  type OpportunityIntelligenceProvider,
} from "../../lib/opportunity-intelligence/provider";
import {
  clearOpportunityInsightCacheForTests,
  generateOpportunityInsight,
} from "../../lib/opportunity-intelligence/service";
import {
  resetInsightTelemetryForTests,
  snapshotInsightTelemetry,
} from "../../lib/opportunity-intelligence/telemetry";
import { isAiSearchableOpportunity } from "../../lib/opportunity-trust";
import { geographyOf } from "../../lib/taxonomy";
import {
  PUBLIC_CORPUS_EVALUATION_CASES,
  PUBLIC_CORPUS_EVALUATION_NOW,
  type PublicCorpusEvaluationCase,
} from "./public-corpus-cases";

function validAssistance(
  input: ReturnType<typeof buildSanitizedOpportunityIntelligenceInput>
): ModelOpportunityAssistance {
  const matchRefs = input.evidenceCatalog
    .filter((entry) => entry.id.startsWith("match."))
    .map((entry) => entry.id);
  const factRef = input.evidenceCatalog.find((entry) => entry.id === "verified.eligibility")?.id
    ?? "verified.type";
  return {
    readiness: [{
      text: matchRefs.length > 0
        ? "The selected profile fields contain relevant signals; confirm all remaining requirements at the official source."
        : "The supplied profile does not establish a direct fit, so readiness remains unclear.",
      basis: matchRefs.length > 0 ? "profile_observation" : "unknown",
      evidenceRefs: matchRefs.slice(0, 3),
    }],
    missingOrUnclear: [{
      text: "Any requirement absent from the supplied evidence remains unknown.",
      basis: "unknown",
      evidenceRefs: [],
    }],
    nextActions: [{
      text: "Review the official source and verify the complete application requirements before acting.",
      basis: "verified_fact",
      evidenceRefs: [factRef],
    }],
    confidence: {
      level: "medium",
      limitations: ["Only the supplied evidence catalog and selected profile fields were used."],
    },
  };
}

function mockProvider(
  input: ReturnType<typeof buildSanitizedOpportunityIntelligenceInput>
): OpportunityIntelligenceProvider {
  return createMockOpportunityIntelligenceProvider(async () => validAssistance(input));
}

function allItems(insight: OpportunityInsight): InsightItem[] {
  return [...insight.whyFit, ...insight.readiness, ...insight.missingOrUnclear, ...insight.nextActions];
}

async function main(): Promise<void> {
  resetInsightTelemetryForTests();
  let hardFailures = 0;
  let softPassed = 0;
  let softTotal = 0;
  for (const testCase of PUBLIC_CORPUS_EVALUATION_CASES) {
    clearOpportunityInsightCacheForTests();
    const input = buildSanitizedOpportunityIntelligenceInput(
      testCase.opportunity,
      testCase.profile,
      PUBLIC_CORPUS_EVALUATION_NOW
    );
    const baseline = buildDeterministicOpportunityInsight(input);
    const started = performance.now();
    const insight = await generateOpportunityInsight(testCase.opportunity, testCase.profile, {
      now: PUBLIC_CORPUS_EVALUATION_NOW,
      selection: { provider: mockProvider(input), reason: null },
    });
    const latencyMs = Math.round((performance.now() - started) * 10) / 10;
    const failures: string[] = [];
    if (geographyOf(testCase.opportunity) !== testCase.expected.geography) {
      failures.push(`geography is ${String(geographyOf(testCase.opportunity))}, expected ${String(testCase.expected.geography)}`);
    }
    if (baseline.eligibilityAssessment.status !== testCase.expected.eligibility) {
      failures.push("eligibility changed from authoritative evidence");
    }
    if (baseline.deadlineUrgency.level !== testCase.expected.deadlineUrgency) {
      failures.push(`deadline urgency is ${baseline.deadlineUrgency.level}, expected ${testCase.expected.deadlineUrgency}`);
    }
    if (JSON.stringify(insight.whyFit) !== JSON.stringify(baseline.whyFit)) {
      failures.push("provider changed deterministic fit");
    }
    if (JSON.stringify(insight.eligibilityAssessment) !== JSON.stringify(baseline.eligibilityAssessment)) {
      failures.push("provider changed verified eligibility");
    }
    if (insight.mode !== "ai") failures.push("mock provider response did not validate");
    if (insight.whyFit.length < testCase.expected.minimumWhyFit) failures.push("whyFit below minimum");
    if (testCase.expected.eligibility === "unknown" && !insight.missingOrUnclear.some((item) => item.basis === "unknown")) {
      failures.push("unknown eligibility not surfaced as unknown");
    }
    if (insight.mode === "ai" && allItems(insight).some((item) => /passport required|must hold a degree|minimum years|93%|guaranteed/i.test(item.text))) {
      failures.push("invented requirement or guarantee presented as fact");
    }
    if (isAiSearchableOpportunity(testCase.opportunity, PUBLIC_CORPUS_EVALUATION_NOW) !== testCase.expected.trustedForRuntime) {
      failures.push(`runtime trust gate is ${String(isAiSearchableOpportunity(testCase.opportunity, PUBLIC_CORPUS_EVALUATION_NOW))}, expected ${String(testCase.expected.trustedForRuntime)}`);
    }
    softTotal += 1;
    if (failures.length === 0) {
      softPassed += 1;
      console.log(`PASS  ${testCase.id} (${latencyMs}ms, mode=${insight.mode})`);
    } else {
      hardFailures += failures.length;
      console.error(`FAIL  ${testCase.id}: ${failures.join("; ")}`);
    }
  }
  const telemetry = snapshotInsightTelemetry();
  console.log(`\npublic-corpus: ${PUBLIC_CORPUS_EVALUATION_CASES.length} cases, ${softPassed}/${softTotal} passed, ${hardFailures} hard failures`);
  console.log(`telemetry: attempts=${telemetry.providerAttempts} ai=${telemetry.aiSuccesses} fallbacks=${telemetry.deterministicFallbacks} invalid=${telemetry.validationFailures} quota=${telemetry.quotaExhausted} timeouts=${telemetry.timeouts}`);
  console.log(`PUBLIC_CORPUS_EVALUATION_JSON=${JSON.stringify({ cases: PUBLIC_CORPUS_EVALUATION_CASES.map((c: PublicCorpusEvaluationCase) => c.id), passed: softPassed, total: softTotal, hardFailures, telemetry })}`);
  if (hardFailures > 0) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Evaluation failed");
    process.exitCode = 1;
  });
}
