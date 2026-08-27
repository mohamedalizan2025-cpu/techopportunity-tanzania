/**
 * Provider boundary. Deliberately minimal: no SDK, no endpoint, no provider
 * chosen. The assistant route treats this module as the ONLY place that may
 * ever call a language model, and only when BOTH conditions hold:
 *   1. ASSISTANT_ENABLED === "true"  (kill switch, server-side env)
 *   2. ASSISTANT_PROVIDER_API_KEY is present (server-side env)
 * Until the owner approves a provider and supplies the credential, every
 * call throws ProviderNotConfigured and the route falls back to
 * deterministic keyword search. Nothing here is a fake LLM.
 */

export class ProviderNotConfiguredError extends Error {
  constructor(message = "assistant provider not configured") {
    super(message);
    this.name = "ProviderNotConfiguredError";
  }
}

export function isProviderConfigured(): boolean {
  const key = process.env.ASSISTANT_PROVIDER_API_KEY;
  return Boolean(key && key.trim().length > 0);
}

export async function interpretQuestion(question: string): Promise<never> {
  // The question is intentionally unused until a provider is approved; the
  // parameter is kept so the activation diff only adds the provider call.
  void question;
  if (!isProviderConfigured()) throw new ProviderNotConfiguredError();
  // Provider selection is an explicit future decision (design doc §B3).
  // Intentionally unreachable until the owner approves one and this module
  // is extended with a single fetch-based call that returns raw JSON only.
  throw new ProviderNotConfiguredError("provider endpoint not selected");
}
