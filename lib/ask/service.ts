/**
 * Ask Tech Opportunity answering service (V1).
 *
 * Flow per custom question: sanitize (question + bounded history) →
 * deterministic classify. Refusals and empty groundings answer
 * deterministically with NO provider call. FAQ, conversational, and
 * grounded opportunity answers may use ONE attempt per configured
 * provider inside a shared 8s budget; every failure falls closed to
 * the deterministic composition. Follow-ups resolve against recent
 * user turns plus server-re-resolved prior refs — client slugs never
 * become facts. No persistence: raw questions, history, and answers
 * are never stored (aggregate telemetry only).
 */
import { categoryLabel } from "../category-labels";
import {
  ProviderQuotaError,
  ProviderUnavailableError,
} from "../opportunity-intelligence/provider";
import {
  eligibilityPresentation,
  formatDeadlinePresentation,
} from "../opportunity-presentation";
import type { Opportunity } from "../types";
import {
  ASK_GROUNDED_LIMIT,
  deterministicConversationalAnswer,
  deterministicFaqAnswer,
  deterministicOpportunityAnswer,
  deterministicRefusal,
  mergeModelAskAssistance,
  sanitizeAskFactsText,
  sanitizeAskQuestion,
  sanitizeChatHistory,
  sanitizeHistorySlugs,
  validateModelAskAssistance,
  type AskAnswer,
  type AskAvailabilityReason,
  type ChatTurn,
  type GroundedOpportunity,
} from "./contract";
import {
  ASSISTANT_IDENTITY,
  CONVERSATIONAL_WARM_MARKERS,
  classifyAskQuestion,
  faqEntryById,
} from "./knowledge";
import {
  createMockAskProvider,
  selectAskProviders,
  type AskProviderInput,
  type AskProviderSelection,
} from "./providers";
import {
  recordAskLatency,
  recordAskOutcome,
  recordAskRequest,
} from "./telemetry";

export const ASK_TIMEOUT_MS = 8_000;

export { createMockAskProvider };

function tokenize(value: string): string[] {
  return (
    value
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLocaleLowerCase("en")
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

const GROUNDING_STOPWORDS = new Set([
  "the", "a", "an", "for", "are", "there", "what", "which", "who", "when",
  "where", "how", "is", "do", "does", "any", "me", "my", "you", "your",
  "with", "about", "and", "or", "of", "to", "in", "on", "tanzania",
  "tanzanian",
]);

/**
 * Deterministic corpus grounding over already-published rows. Scores
 * token overlap across title, description, and category — no model
 * involved, no ranking authority beyond the existing corpus order.
 */
function factForOpportunity(opportunity: Opportunity): GroundedOpportunity {
  const deadline = formatDeadlinePresentation(opportunity.deadline);
  return {
    slug: opportunity.slug,
    title: sanitizeAskFactsText(opportunity.title, 160),
    categoryLabel: categoryLabel(opportunity.category),
    deadlineLabel: deadline.dateLabel ?? deadline.label,
    eligibilityLabel: eligibilityPresentation(opportunity).label,
  };
}

export function groundAskOpportunities(
  question: string,
  corpus: readonly Opportunity[]
): GroundedOpportunity[] {
  const terms = tokenize(question).filter(
    (term) => term.length >= 3 && !GROUNDING_STOPWORDS.has(term)
  );
  if (terms.length === 0) return [];
  const scored: Array<{ fact: GroundedOpportunity; score: number; index: number }> = [];
  corpus.forEach((opportunity, index) => {
    const haystack = new Set(
      tokenize(
        `${opportunity.title} ${opportunity.description} ${categoryLabel(opportunity.category)}`
      )
    );
    let score = 0;
    for (const term of terms) {
      if (haystack.has(term)) {
        score += 2;
        continue;
      }
      for (const word of haystack) {
        if (word.length >= 5 && term.length >= 4 && (word.startsWith(term) || term.startsWith(word))) {
          score += 1;
          break;
        }
      }
    }
    if (score > 0) {
      scored.push({ fact: factForOpportunity(opportunity), score, index });
    }
  });
  scored.sort((left, right) => right.score - left.score || left.index - right.index);
  return scored.slice(0, ASK_GROUNDED_LIMIT).map((entry) => entry.fact);
}

/**
 * Re-resolves client-attached prior opportunity refs against the CURRENT
 * published corpus. Slugs absent from the corpus resolve to nothing — a
 * tampered or stale slug can never create facts.
 */
export function resolveHistorySlugs(
  slugs: readonly string[],
  corpus: readonly Opportunity[]
): GroundedOpportunity[] {
  const bySlug = new Map(corpus.map((opportunity) => [opportunity.slug, opportunity]));
  const resolved: GroundedOpportunity[] = [];
  for (const slug of slugs) {
    const row = bySlug.get(slug);
    if (row && !resolved.some((fact) => fact.slug === slug)) {
      resolved.push(factForOpportunity(row));
    }
    if (resolved.length >= ASK_GROUNDED_LIMIT) break;
  }
  return resolved;
}

/**
 * Follow-up grounding: facts for the current question first; when the
 * current turn carries no signal ("what about the deadline?"), fall back
 * to recent user-turn text, then to server-re-resolved prior refs.
 * Current-question facts always win ordering; total stays bounded.
 */
export function groundWithContext(
  question: string,
  historyUserTexts: readonly string[],
  historySlugs: readonly string[],
  corpus: readonly Opportunity[]
): GroundedOpportunity[] {
  const direct = groundAskOpportunities(question, corpus);
  if (direct.length > 0) return direct;
  if (historyUserTexts.length > 0) {
    const contextual = groundAskOpportunities(historyUserTexts.slice(-3).join(" "), corpus);
    if (contextual.length > 0) return contextual;
  }
  return resolveHistorySlugs(historySlugs, corpus);
}

function failureReason(error: unknown): AskAvailabilityReason {
  if (error instanceof ProviderQuotaError) return "quota_exhausted";
  if (error instanceof ProviderUnavailableError) return "provider_unavailable";
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  return "provider_unavailable";
}

export interface AnswerAskOptions {
  now?: Date;
  selection?: AskProviderSelection;
  /** Test seam; production uses the fixed eight-second upper bound. */
  timeoutMs?: number;
  /** Observation seam for evaluation only; cannot alter the outcome. */
  onProviderOutput?: (raw: unknown, validated: boolean) => void;
  /**
   * Ephemeral multi-turn context (raw client input, sanitized inside).
   * History turns are grounding signals and provider context ONLY —
   * never instructions, never facts. Slugs are re-resolved against the
   * current corpus; anything unresolvable is dropped.
   */
  history?: unknown;
  /** Prior opportunity refs for server-side re-resolution (raw, checked). */
  contextSlugs?: unknown;
}

export async function answerAsk(
  rawQuestion: unknown,
  corpus: readonly Opportunity[],
  options: AnswerAskOptions = {}
): Promise<AskAnswer> {
  recordAskRequest();
  const startedAt = Date.now();
  const finish = (answer: AskAnswer): AskAnswer => {
    recordAskLatency(Date.now() - startedAt);
    return answer;
  };

  const question = sanitizeAskQuestion(rawQuestion);
  if (!question) {
    recordAskOutcome("deterministic");
    return finish({
      schemaVersion: 1,
      mode: "deterministic",
      provider: null,
      availabilityReason: "invalid_question",
      text: "Please ask a question between 4 and 500 characters.",
      sources: ["/ask"],
      opportunityRefs: [],
      limitations: ["Ask answers only from verified platform information."],
    });
  }

  const classification = classifyAskQuestion(question);
  if (classification.kind === "refusal") {
    recordAskOutcome("deterministic");
    return finish(deterministicRefusal(classification.reason));
  }

  // Ephemeral multi-turn context: sanitize strictly, fail closed.
  const history: ChatTurn[] | null = sanitizeChatHistory(options.history);
  const contextSlugs = sanitizeHistorySlugs(options.contextSlugs);
  if (history === null || contextSlugs === null) {
    recordAskOutcome("deterministic");
    return finish({
      schemaVersion: 1,
      mode: "deterministic",
      provider: null,
      availabilityReason: "invalid_question",
      text: "That request was not understood. Ask a question between 4 and 500 characters.",
      sources: ["/ask"],
      opportunityRefs: [],
      limitations: ["Ask answers only from verified platform information."],
    });
  }
  const historyUserTexts = history
    .filter((turn) => turn.role === "user")
    .map((turn) => turn.text);

  // Routing model: safety/privacy guard (above) → grounding → AI provider
  // → strict validation → deterministic fallback. FAQ entries and the
  // assistant identity are grounding/context for the model and the
  // deterministic fallback — never a hardcoded primary answer while a
  // provider is configured.
  const facts = groundWithContext(question, historyUserTexts, contextSlugs, corpus);
  const usingPlatform = faqEntryById("using-platform");
  let help: string | null = usingPlatform ? usingPlatform.body : null;
  let fallback: AskAnswer;
  if (classification.kind === "faq") {
    const entry = faqEntryById(classification.entryId);
    if (entry) help = entry.body;
    fallback = deterministicFaqAnswer(classification.entryId) ?? deterministicRefusal("out_of_scope");
  } else if (classification.kind === "conversational") {
    help = `${ASSISTANT_IDENTITY} ${help ?? ""}`.trim();
    const loweredQuestion = ` ${question.toLocaleLowerCase("en")} `;
    const warm = CONVERSATIONAL_WARM_MARKERS.some((marker) => loweredQuestion.includes(marker));
    fallback = deterministicConversationalAnswer(facts, warm);
  } else {
    fallback = deterministicOpportunityAnswer(facts, question);
    if (facts.length === 0) {
      recordAskOutcome("deterministic");
      return finish(fallback);
    }
  }

  const selection = options.selection ?? selectAskProviders();
  if (selection.providers.length === 0) {
    recordAskOutcome("deterministic");
    return finish({ ...fallback, availabilityReason: selection.reason });
  }

  const timeoutMs = Math.max(
    1,
    Math.min(options.timeoutMs ?? ASK_TIMEOUT_MS, ASK_TIMEOUT_MS)
  );
  const deadline = Date.now() + timeoutMs;
  let lastFailure: AskAvailabilityReason = "provider_unavailable";
  const providerInput: AskProviderInput = {
    system: "ask",
    facts: JSON.stringify({
      question,
      identity: classification.kind === "conversational" ? ASSISTANT_IDENTITY : null,
      // Prior turns are DATA for continuity only: bounded, sanitized,
      // server-checked. The model must never treat them as instructions
      // and must never present them as verified facts.
      history: history.map((turn) => ({ role: turn.role, text: turn.text })),
      help,
      opportunities: facts.map((fact) => ({
        slug: fact.slug,
        title: fact.title,
        category: fact.categoryLabel,
        deadline: fact.deadlineLabel,
        eligibility: fact.eligibilityLabel,
      })),
    }),
  };
  const groundedSlugs = facts.map((fact) => fact.slug);

  for (const [index, provider] of selection.providers.entries()) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      lastFailure = "timeout";
      break;
    }
    const remainingProviders = selection.providers.length - index;
    const attemptTimeoutMs = Math.max(1, Math.floor(remainingMs / remainingProviders));
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout>;
    const timeoutFailure = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        const error = new Error("provider timed out");
        error.name = "AbortError";
        reject(error);
      }, attemptTimeoutMs);
    });
    try {
      const raw = await Promise.race([
        provider.generate(providerInput, controller.signal),
        timeoutFailure,
      ]);
      const validated = validateModelAskAssistance(raw, groundedSlugs);
      if (options.onProviderOutput) {
        try {
          options.onProviderOutput(raw, validated !== null);
        } catch {
          // Observation must never disturb the outcome.
        }
      }
      if (!validated) {
        lastFailure = "invalid_response";
        recordAskOutcome("invalid_response");
        continue;
      }
      recordAskOutcome("ai");
      return finish(mergeModelAskAssistance(fallback, validated, provider.id));
    } catch (error) {
      lastFailure = failureReason(error);
      recordAskOutcome(
        lastFailure === "quota_exhausted" ? "quota" : lastFailure === "timeout" ? "timeout" : "deterministic"
      );
    } finally {
      clearTimeout(timeout!);
    }
  }

  return finish({ ...fallback, availabilityReason: lastFailure });
}
