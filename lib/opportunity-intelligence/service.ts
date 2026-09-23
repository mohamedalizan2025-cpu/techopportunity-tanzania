import { createHash } from "node:crypto";
import {
  buildDeterministicOpportunityInsight,
  buildSanitizedOpportunityIntelligenceInput,
  mergeModelOpportunityAssistance,
  validateModelOpportunityAssistance,
  type InsightAvailabilityReason,
  type OpportunityInsight,
} from "./contract";
import {
  ProviderQuotaError,
  ProviderUnavailableError,
  selectConfiguredOpportunityIntelligenceProvider,
  type OpportunityIntelligenceProvider,
  type ProviderSelection,
} from "./provider";
import type { MatchingInput } from "../personalization";
import type { Opportunity } from "../types";

const PROVIDER_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1_000;
const MAX_CACHE_ENTRIES = 200;

const cache = new Map<string, { expiresAt: number; value: unknown }>();

function cacheKey(provider: OpportunityIntelligenceProvider, input: unknown): string {
  return createHash("sha256")
    .update(`${provider.cacheKey}\n${JSON.stringify(input)}`)
    .digest("hex");
}

function getCached(key: string, now: number): unknown | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= now) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached(key: string, value: unknown, now: number): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { expiresAt: now + CACHE_TTL_MS, value });
}

function providersForSelection(selection: ProviderSelection): readonly OpportunityIntelligenceProvider[] {
  if (selection.providers && selection.providers.length > 0) return selection.providers;
  return selection.provider ? [selection.provider] : [];
}

function failureReason(error: unknown): InsightAvailabilityReason {
  if (error instanceof ProviderQuotaError) return "quota_exhausted";
  if (error instanceof ProviderUnavailableError) return "provider_unavailable";
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  return "provider_unavailable";
}

export interface GenerateOpportunityInsightOptions {
  now?: Date;
  selection?: ProviderSelection;
  /** Test seam; production uses the fixed eight-second upper bound. */
  timeoutMs?: number;
}

export async function generateOpportunityInsight(
  opportunity: Opportunity,
  matchingInput: MatchingInput,
  options: GenerateOpportunityInsightOptions = {}
): Promise<OpportunityInsight> {
  const now = options.now ?? new Date();
  const input = buildSanitizedOpportunityIntelligenceInput(opportunity, matchingInput, now);
  const selection = options.selection ?? selectConfiguredOpportunityIntelligenceProvider();
  const fallback = buildDeterministicOpportunityInsight(
    input,
    selection.reason ?? "provider_unavailable"
  );
  const providers = providersForSelection(selection);
  if (providers.length === 0) return fallback;

  const timeoutMs = Math.max(1, Math.min(options.timeoutMs ?? PROVIDER_TIMEOUT_MS, PROVIDER_TIMEOUT_MS));
  const deadline = Date.now() + timeoutMs;
  let lastFailure: InsightAvailabilityReason = "provider_unavailable";

  for (const [index, provider] of providers.entries()) {
    const key = cacheKey(provider, input);
    const cached = getCached(key, now.getTime());
    if (cached !== undefined) {
      const validated = validateModelOpportunityAssistance(cached, input);
      if (validated) return mergeModelOpportunityAssistance(fallback, validated, provider.id);
      cache.delete(key);
      lastFailure = "invalid_response";
      continue;
    }

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      lastFailure = "timeout";
      break;
    }
    const remainingProviders = providers.length - index;
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
        provider.generate(input, controller.signal),
        timeoutFailure,
      ]);
      const validated = validateModelOpportunityAssistance(raw, input);
      if (!validated) {
        lastFailure = "invalid_response";
        continue;
      }
      setCached(key, raw, now.getTime());
      return mergeModelOpportunityAssistance(fallback, validated, provider.id);
    } catch (error) {
      lastFailure = failureReason(error);
    } finally {
      clearTimeout(timeout!);
    }
  }

  return buildDeterministicOpportunityInsight(input, lastFailure);
}

export function clearOpportunityInsightCacheForTests(): void {
  cache.clear();
}
