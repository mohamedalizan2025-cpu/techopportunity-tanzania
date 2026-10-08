/**
 * Ask Tech Opportunity answering service (V1).
 *
 * Flow per custom question: sanitize → deterministic classify. FAQ hits,
 * refusals, and empty groundings answer deterministically with NO
 * provider call. Grounded opportunity/FAQ answers may use ONE attempt
 * per configured provider inside a shared 8s budget; every failure
 * falls closed to the deterministic composition. No persistence: raw
 * questions and answers are never stored (aggregate telemetry only).
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
  validateModelAskAssistance,
  type AskAnswer,
  type AskAvailabilityReason,
  type GroundedOpportunity,
} from "./contract";
import { ASSISTANT_IDENTITY, classifyAskQuestion, faqEntryById } from "./knowledge";
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
      const deadline = formatDeadlinePresentation(opportunity.deadline);
      scored.push({
        fact: {
          slug: opportunity.slug,
          title: sanitizeAskFactsText(opportunity.title, 160),
          categoryLabel: categoryLabel(opportunity.category),
          deadlineLabel: deadline.dateLabel ?? deadline.label,
          eligibilityLabel: eligibilityPresentation(opportunity).label,
        },
        score,
        index,
      });
    }
  });
  scored.sort((left, right) => right.score - left.score || left.index - right.index);
  return scored.slice(0, ASK_GROUNDED_LIMIT).map((entry) => entry.fact);
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

  // Routing model: safety/privacy guard (above) → grounding → AI provider
  // → strict validation → deterministic fallback. FAQ entries and the
  // assistant identity are grounding/context for the model and the
  // deterministic fallback — never a hardcoded primary answer while a
  // provider is configured.
  const facts = groundAskOpportunities(question, corpus);
  const usingPlatform = faqEntryById("using-platform");
  let help: string | null = usingPlatform ? usingPlatform.body : null;
  let fallback: AskAnswer;
  if (classification.kind === "faq") {
    const entry = faqEntryById(classification.entryId);
    if (entry) help = entry.body;
    fallback = deterministicFaqAnswer(classification.entryId) ?? deterministicRefusal("out_of_scope");
  } else if (classification.kind === "conversational") {
    help = `${ASSISTANT_IDENTITY} ${help ?? ""}`.trim();
    fallback = deterministicConversationalAnswer(facts);
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
