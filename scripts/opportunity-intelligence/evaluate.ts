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
  buildOpportunityIntelligenceMessages,
  createGeminiProvider,
  createGroqProvider,
  createMockOpportunityIntelligenceProvider,
  type OpportunityIntelligenceProvider,
  type ProviderSelection,
} from "../../lib/opportunity-intelligence/provider";
import {
  clearOpportunityInsightCacheForTests,
  generateOpportunityInsight,
} from "../../lib/opportunity-intelligence/service";
import { isAiSearchableOpportunity } from "../../lib/opportunity-trust";
import { geographyOf } from "../../lib/taxonomy";
import {
  EVALUATION_NOW,
  OPPORTUNITY_INTELLIGENCE_EVALUATION_CORPUS,
  type OpportunityIntelligenceEvaluationCase,
} from "./evaluation-corpus";

export const REAL_EVALUATION_CONFIRMATION = "AI-EVAL-FREE-QUOTA";
export const REAL_GEMINI_EVALUATION_CONFIRMATION = "AI-EVAL-GEMINI-FREE-QUOTA";
export type RealEvaluationProvider = "gemini" | "groq";

export interface RealEvaluationGate {
  ready: boolean;
  reasons: string[];
  selection: ProviderSelection;
  providerId: RealEvaluationProvider;
  model: string;
  privacyConfirmed: boolean;
  zdrConfirmed: boolean;
  noBillingConfirmed: boolean;
}

export function resolveRealEvaluationGate(
  env: Readonly<Record<string, string | undefined>>,
  confirmation: string | undefined,
  fetchImpl: typeof fetch = fetch,
  providerId: RealEvaluationProvider = "groq"
): RealEvaluationGate {
  const reasons: string[] = [];
  const isGemini = providerId === "gemini";
  const expectedConfirmation = isGemini
    ? REAL_GEMINI_EVALUATION_CONFIRMATION
    : REAL_EVALUATION_CONFIRMATION;
  const zdrConfirmed = !isGemini && env.AI_EVALUATION_ZDR_CONFIRMED === "true";
  const geminiDataUseConfirmed =
    isGemini && env.AI_EVALUATION_GEMINI_UNPAID_DATA_USE_CONFIRMED === "true";
  const privacyConfirmed = zdrConfirmed || geminiDataUseConfirmed;
  const noBillingConfirmed = isGemini
    ? env.AI_EVALUATION_GEMINI_NO_BILLING_CONFIRMED === "true"
    : env.AI_EVALUATION_NO_BILLING_CONFIRMED === "true";
  const model = isGemini
    ? env.AI_OPPORTUNITY_INTELLIGENCE_GEMINI_MODEL ?? ""
    : env.AI_OPPORTUNITY_INTELLIGENCE_GROQ_MODEL ?? env.AI_OPPORTUNITY_INTELLIGENCE_MODEL ?? "";
  const expectedModel = isGemini ? "gemini-3.5-flash-lite" : "openai/gpt-oss-20b";
  const apiKey = isGemini ? env.GEMINI_API_KEY?.trim() : env.GROQ_API_KEY?.trim();
  if (confirmation !== expectedConfirmation) reasons.push("explicit evaluation confirmation missing");
  if (!privacyConfirmed) {
    reasons.push(isGemini
      ? "Gemini unpaid-service data-use confirmation missing"
      : "Groq Zero Data Retention confirmation missing");
  }
  if (!noBillingConfirmed) reasons.push("free-quota/no-uncontrolled-billing confirmation missing");
  if (model !== expectedModel) {
    reasons.push(`target model is not exactly ${expectedModel}`);
  }
  if (!apiKey) reasons.push(`${isGemini ? "Gemini" : "Groq"} credential missing`);
  const provider = apiKey && model === expectedModel
    ? isGemini
      ? createGeminiProvider(apiKey, model, fetchImpl)
      : createGroqProvider(apiKey, model, fetchImpl)
    : null;
  const selection: ProviderSelection = {
    provider,
    reason: provider ? null : "not_configured",
  };
  if (!provider || provider.id !== providerId) {
    reasons.push(`${isGemini ? "Gemini" : "Groq"} provider unavailable`);
  }
  return {
    ready: reasons.length === 0,
    reasons,
    selection,
    providerId,
    model: expectedModel,
    privacyConfirmed,
    zdrConfirmed,
    noBillingConfirmed,
  };
}

function validAssistance(
  testCase: OpportunityIntelligenceEvaluationCase,
  input: ReturnType<typeof buildSanitizedOpportunityIntelligenceInput>
): ModelOpportunityAssistance {
  const matchRefs = input.evidenceCatalog
    .filter((entry) => entry.id.startsWith("match."))
    .map((entry) => entry.id);
  const factRef = input.evidenceCatalog.find((entry) => entry.id === "verified.eligibility")?.id
    ?? "verified.type";
  const readiness: InsightItem = matchRefs.length > 0
    ? {
        text: "The selected profile fields contain relevant signals; confirm all remaining requirements at the official source.",
        basis: "profile_observation",
        evidenceRefs: matchRefs.slice(0, 3),
      }
    : {
        text: "The supplied profile does not establish a direct fit, so readiness remains unclear.",
        basis: "unknown",
        evidenceRefs: [],
      };
  return {
    readiness: [readiness],
    missingOrUnclear: [{
      text: testCase.coverage.includes("missing requirements")
        ? "The supplied evidence does not state every required application document."
        : "Any requirement absent from the supplied evidence remains unknown.",
      basis: "unknown",
      evidenceRefs: [],
    }],
    nextActions: [{
      text: "Review the official source and verify the complete application requirements before acting.",
      basis: "verified_fact",
      evidenceRefs: [factRef],
    }],
    confidence: {
      level: testCase.coverage.includes("conflicting/limited evidence") ? "low" : "medium",
      limitations: ["Only the supplied evidence catalog and selected profile fields were used."],
    },
  };
}

function mockProviderForCase(
  testCase: OpportunityIntelligenceEvaluationCase,
  input: ReturnType<typeof buildSanitizedOpportunityIntelligenceInput>,
  onRequest: () => void
): OpportunityIntelligenceProvider {
  return createMockOpportunityIntelligenceProvider(async () => {
    onRequest();
    const valid = validAssistance(testCase, input);
    if (testCase.providerBehavior === "malformed") return { readiness: "not-an-array" };
    if (testCase.providerBehavior === "attempt_override") {
      return {
        ...valid,
        geography: "national",
        eligibilityAssessment: { status: "verified_for_tanzanians" },
        trust: "override",
      };
    }
    return valid;
  });
}

function allItems(insight: OpportunityInsight): InsightItem[] {
  return [
    ...insight.whyFit,
    ...insight.readiness,
    ...insight.missingOrUnclear,
    ...insight.nextActions,
  ];
}

function conciseAndNonRepetitive(insight: OpportunityInsight): boolean {
  const texts = allItems(insight).map((item) => item.text);
  return texts.every((text) => text.length <= 320) && new Set(texts).size === texts.length;
}

export interface EvaluationCaseResult {
  id: string;
  coverage: string[];
  mode: OpportunityInsight["mode"];
  availabilityReason: OpportunityInsight["availabilityReason"];
  latencyMs: number;
  hardFailures: string[];
  softChecks: {
    usefulWhyFit: boolean;
    readinessPresent: boolean;
    nextActionsPresent: boolean;
    unknownsHandled: boolean;
    conciseAndNonRepetitive: boolean;
  };
  outputForReview: Pick<
    OpportunityInsight,
    "readiness" | "missingOrUnclear" | "nextActions" | "confidence"
  >;
}

export interface OpportunityIntelligenceEvaluationReport {
  schemaVersion: 1;
  generatedAt: string;
  corpusVersion: "2026-09-22-v1";
  execution:
    | "contract-simulation"
    | "real-gemini"
    | "real-gemini-pending"
    | "real-groq"
    | "real-groq-pending";
  provider: string | null;
  model: "gemini-3.5-flash-lite" | "openai/gpt-oss-20b";
  cases: EvaluationCaseResult[];
  summary: {
    caseCount: number;
    requestCount: number;
    successfulStructuredResponses: number;
    fallbacks: number;
    quotaFailures: number;
    timeouts: number;
    hardFailureCount: number;
    softChecksPassed: number;
    softChecksTotal: number;
    latencyMs: { minimum: number | null; median: number | null; maximum: number | null };
  };
  privacy: {
    privateProductionDataUsed: false;
    providerDataUseStatus:
      | "confirmed-gemini-unpaid-data-use"
      | "confirmed-groq-zdr"
      | "pending-owner-confirmation"
      | "not-applicable-contract-simulation";
    billingExposureStatus: "confirmed-free-quota" | "pending-owner-confirmation" | "not-applicable-contract-simulation";
  };
  pilotRecommendation:
    | "do-not-activate-real-provider-not-evaluated"
    | "do-not-activate-hard-failure"
    | "eligible-for-owner-reviewed-small-pilot";
  pendingReasons: string[];
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[middle - 1] + sorted[middle]) / 2) * 10) / 10
    : Math.round(sorted[middle] * 10) / 10;
}

async function evaluateCases(
  providerMode: "contract" | "real",
  provider: OpportunityIntelligenceProvider | null
): Promise<{ cases: EvaluationCaseResult[]; requestCount: number }> {
  const results: EvaluationCaseResult[] = [];
  let requestCount = 0;
  for (const testCase of OPPORTUNITY_INTELLIGENCE_EVALUATION_CORPUS) {
    clearOpportunityInsightCacheForTests();
    const input = buildSanitizedOpportunityIntelligenceInput(
      testCase.opportunity,
      testCase.profile,
      EVALUATION_NOW
    );
    const baseline = buildDeterministicOpportunityInsight(input);
    const selection: ProviderSelection = providerMode === "real"
      ? { provider, reason: provider ? null : "not_configured" }
      : {
          provider: mockProviderForCase(testCase, input, () => { requestCount += 1; }),
          reason: null,
        };
    if (providerMode === "real" && provider) requestCount += 1;
    const started = performance.now();
    const insight = await generateOpportunityInsight(testCase.opportunity, testCase.profile, {
      now: EVALUATION_NOW,
      selection,
    });
    const latencyMs = Math.round((performance.now() - started) * 10) / 10;
    const hardFailures: string[] = [];
    const serializedInput = JSON.stringify(input);
    const actualGeography = geographyOf(testCase.opportunity);
    const actualTrusted = isAiSearchableOpportunity(testCase.opportunity, EVALUATION_NOW);

    if (actualGeography !== testCase.expected.geography || input.opportunity.geography !== testCase.expected.geography) {
      hardFailures.push("geography changed from deterministic baseline");
    }
    if (baseline.eligibilityAssessment.status !== testCase.expected.eligibility) {
      hardFailures.push("eligibility changed from authoritative evidence");
    }
    if (baseline.deadlineUrgency.level !== testCase.expected.deadlineUrgency) {
      hardFailures.push("deadline urgency changed from deterministic evidence");
    }
    if (actualTrusted !== testCase.expected.trustedForRuntime) {
      hardFailures.push("runtime trust gate differs from expected fixture evidence");
    }
    if (JSON.stringify(insight.whyFit) !== JSON.stringify(baseline.whyFit)) {
      hardFailures.push("provider changed deterministic fit");
    }
    if (JSON.stringify(insight.eligibilityAssessment) !== JSON.stringify(baseline.eligibilityAssessment)) {
      hardFailures.push("provider changed verified eligibility");
    }
    if (JSON.stringify(insight.deadlineUrgency) !== JSON.stringify(baseline.deadlineUrgency)) {
      hardFailures.push("provider changed deadline facts");
    }
    for (const fragment of testCase.forbiddenProviderFragments ?? []) {
      if (serializedInput.includes(fragment)) hardFailures.push(`private identifier reached provider input: ${fragment}`);
    }
    if (testCase.injectionMarker) {
      const messages = buildOpportunityIntelligenceMessages(input);
      if (messages[0].content.includes(testCase.injectionMarker)) {
        hardFailures.push("prompt injection entered system instructions");
      }
      if (!messages[1].content.includes(testCase.injectionMarker)) {
        hardFailures.push("prompt-injection fixture was not preserved as data");
      }
    }
    if (providerMode === "contract" && insight.mode !== testCase.expected.providerMode) {
      hardFailures.push("malformed or override output did not follow expected validation/fallback path");
    }
    if (insight.mode === "ai" && allItems(insight).some((item) => /passport required|must hold a degree|minimum years/i.test(item.text))) {
      hardFailures.push("invented requirement presented as fact");
    }

    const expectsUnknown = testCase.expected.eligibility === "unknown" ||
      testCase.coverage.includes("missing requirements") ||
      testCase.coverage.includes("conflicting/limited evidence");
    results.push({
      id: testCase.id,
      coverage: testCase.coverage,
      mode: insight.mode,
      availabilityReason: insight.availabilityReason,
      latencyMs,
      hardFailures,
      softChecks: {
        usefulWhyFit: insight.whyFit.length >= testCase.expected.minimumWhyFit,
        readinessPresent: insight.readiness.length > 0,
        nextActionsPresent: insight.nextActions.length > 0,
        unknownsHandled: !expectsUnknown || insight.missingOrUnclear.some((item) => item.basis === "unknown"),
        conciseAndNonRepetitive: conciseAndNonRepetitive(insight),
      },
      outputForReview: {
        readiness: insight.readiness,
        missingOrUnclear: insight.missingOrUnclear,
        nextActions: insight.nextActions,
        confidence: insight.confidence,
      },
    });
  }
  return { cases: results, requestCount };
}

export async function runOpportunityIntelligenceEvaluation(options: {
  realProvider?: RealEvaluationProvider;
  realGroq?: boolean;
  confirmation?: string;
  env?: Readonly<Record<string, string | undefined>>;
  fetchImpl?: typeof fetch;
} = {}): Promise<OpportunityIntelligenceEvaluationReport> {
  const env = options.env ?? process.env;
  const requestedProvider = options.realProvider ?? (options.realGroq ? "groq" : null);
  const realGate = requestedProvider
    ? resolveRealEvaluationGate(
        env,
        options.confirmation,
        options.fetchImpl ?? fetch,
        requestedProvider
      )
    : null;
  const realReady = realGate?.ready === true;
  const evaluated = await evaluateCases(realReady ? "real" : "contract", realReady ? realGate.selection.provider : null);
  const cases = evaluated.cases;
  const latencies = cases.map((item) => item.latencyMs);
  const hardFailureCount = cases.reduce((sum, item) => sum + item.hardFailures.length, 0);
  const softValues = cases.flatMap((item) => Object.values(item.softChecks));
  const fallbacks = cases.filter((item) => item.mode === "deterministic").length;
  const quotaFailures = cases.filter((item) => item.availabilityReason === "quota_exhausted").length;
  const timeouts = cases.filter((item) => item.availabilityReason === "timeout").length;
  const successfulStructuredResponses = cases.filter((item) => item.mode === "ai").length;
  const execution = requestedProvider
    ? realReady ? `real-${requestedProvider}` as const : `real-${requestedProvider}-pending` as const
    : "contract-simulation";
  const requestCount = execution.endsWith("-pending") ? 0 : evaluated.requestCount;
  const pendingReasons = realGate && !realGate.ready
    ? realGate.reasons
    : requestedProvider ? [] : ["real provider evaluation not requested or authorized"];

  let pilotRecommendation: OpportunityIntelligenceEvaluationReport["pilotRecommendation"] =
    "do-not-activate-real-provider-not-evaluated";
  if (hardFailureCount > 0) pilotRecommendation = "do-not-activate-hard-failure";
  else if (
    execution !== "contract-simulation" &&
    !execution.endsWith("-pending") &&
    fallbacks === 0 &&
    quotaFailures === 0 &&
    timeouts === 0 &&
    realGate?.privacyConfirmed &&
    realGate.noBillingConfirmed
  ) {
    pilotRecommendation = "eligible-for-owner-reviewed-small-pilot";
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    corpusVersion: "2026-09-22-v1",
    execution,
    provider: realReady ? realGate.providerId : "mock",
    model: realGate?.model === "gemini-3.5-flash-lite"
      ? "gemini-3.5-flash-lite"
      : "openai/gpt-oss-20b",
    cases,
    summary: {
      caseCount: cases.length,
      requestCount,
      successfulStructuredResponses,
      fallbacks,
      quotaFailures,
      timeouts,
      hardFailureCount,
      softChecksPassed: softValues.filter(Boolean).length,
      softChecksTotal: softValues.length,
      latencyMs: {
        minimum: latencies.length > 0 ? Math.min(...latencies) : null,
        median: median(latencies),
        maximum: latencies.length > 0 ? Math.max(...latencies) : null,
      },
    },
    privacy: {
      privateProductionDataUsed: false,
      providerDataUseStatus: realReady
        ? realGate.providerId === "gemini"
          ? "confirmed-gemini-unpaid-data-use"
          : "confirmed-groq-zdr"
        : requestedProvider ? "pending-owner-confirmation" : "not-applicable-contract-simulation",
      billingExposureStatus: realReady ? "confirmed-free-quota" : requestedProvider
        ? "pending-owner-confirmation"
        : "not-applicable-contract-simulation",
    },
    pilotRecommendation,
    pendingReasons,
  };
}

async function main() {
  const realProvider = process.argv.includes("--provider=gemini")
    ? "gemini"
    : process.argv.includes("--provider=groq") ? "groq" : undefined;
  const confirmation = process.argv
    .find((argument) => argument.startsWith("--confirm="))
    ?.slice("--confirm=".length);
  const report = await runOpportunityIntelligenceEvaluation({ realProvider, confirmation });
  console.log("# AI Opportunity Intelligence evaluation");
  console.log(`Execution: ${report.execution}`);
  console.log(`Cases: ${report.summary.caseCount}`);
  console.log(`Requests: ${report.summary.requestCount}`);
  console.log(`Structured responses: ${report.summary.successfulStructuredResponses}`);
  console.log(`Fallbacks: ${report.summary.fallbacks}`);
  console.log(`Hard failures: ${report.summary.hardFailureCount}`);
  console.log(`Soft checks: ${report.summary.softChecksPassed}/${report.summary.softChecksTotal}`);
  console.log(`Pilot recommendation: ${report.pilotRecommendation}`);
  if (report.pendingReasons.length > 0) {
    console.log(`Pending: ${report.pendingReasons.join("; ")}`);
  }
  console.log(`AI_EVALUATION_REPORT_JSON=${JSON.stringify(report)}`);
  if (report.summary.hardFailureCount > 0) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Evaluation failed");
    process.exitCode = 1;
  });
}
