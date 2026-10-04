"use client";

import { useState } from "react";
import type { OpportunityInsight } from "@/lib/opportunity-intelligence/contract";

/**
 * On-demand per-card fit explanation for For You. Deterministic match
 * reasons always render from the server; this fetches the bounded AI
 * explanation only when the user explicitly asks — never automatically on
 * list render, never a numeric rating. Same endpoint, rate limit, and contract as
 * the detail insight panel.
 */
export function ForYouExplanation({ slug, title }: { slug: string; title: string }) {
  const [insight, setInsight] = useState<OpportunityInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function explain() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/opportunity-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const payload = (await response.json()) as {
        insight?: OpportunityInsight;
        error?: string;
      };
      if (!response.ok || !payload.insight) {
        setError(payload.error || "An explanation is temporarily unavailable.");
        return;
      }
      setInsight(payload.insight);
    } catch {
      setError("An explanation is temporarily unavailable. The deterministic reasons above still apply.");
    } finally {
      setLoading(false);
    }
  }

  if (insight) {
    return (
      <div className="mt-2 rounded-md border border-[var(--line)] bg-[var(--surface)] p-4">
        <p role="status" className="text-xs font-semibold text-[var(--muted)]">
          {insight.mode === "ai"
            ? "AI-assisted explanation based on verified opportunity data"
            : "Deterministic guidance"}
        </p>
        <ul className="mt-2 space-y-2">
          {insight.whyFit.slice(0, 3).map((item, index) => (
            <li key={`${index}-${item.text.slice(0, 24)}`} className="text-sm leading-6 text-[var(--muted)]">
              {item.text}
            </li>
          ))}
          {insight.nextActions.slice(0, 1).map((item, index) => (
            <li key={`next-${index}`} className="text-sm leading-6 text-[var(--muted)]">
              <span className="font-semibold text-[var(--foreground)]">Next: </span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-2">
      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={explain}
        disabled={loading}
        aria-label={`Explain why ${title} fits you`}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? "Explaining…" : "Why this fits you →"}
      </button>
    </div>
  );
}
