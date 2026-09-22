"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  EvidenceBasis,
  InsightItem,
  OpportunityInsight,
} from "@/lib/opportunity-intelligence/contract";

const BASIS_LABELS: Record<EvidenceBasis, string> = {
  verified_fact: "Verified fact",
  profile_observation: "Profile signal",
  unknown: "Unknown",
};

const REASON_LABELS: Record<NonNullable<OpportunityInsight["availabilityReason"]>, string> = {
  disabled: "AI is disabled",
  zero_spend: "zero-spend mode is active",
  not_configured: "no provider is configured",
  provider_unavailable: "the provider is unavailable",
  quota_exhausted: "the free quota is unavailable",
  timeout: "the provider timed out",
  invalid_response: "the provider response failed validation",
};

function InsightList({ items }: { items: InsightItem[] }) {
  if (items.length === 0) {
    return <p className="mt-2 text-sm text-[var(--muted)]">Nothing additional is established.</p>;
  }
  return (
    <ul className="mt-3 space-y-3">
      {items.map((item, index) => (
        <li key={`${item.text}-${index}`} className="text-sm leading-6 text-[var(--muted)]">
          <span className="mr-2 inline-flex rounded-full border border-[var(--line)] px-2 py-0.5 text-[0.7rem] font-semibold text-[var(--foreground)]">
            {BASIS_LABELS[item.basis]}
          </span>
          {item.text}
        </li>
      ))}
    </ul>
  );
}

export function OpportunityInsightPanel({
  slug,
  isAuthenticated,
  loginHref,
}: {
  slug: string;
  isAuthenticated: boolean;
  loginHref: string;
}) {
  const [insight, setInsight] = useState<OpportunityInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadInsight() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/opportunity-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const payload = await response.json() as {
        insight?: OpportunityInsight;
        error?: string;
      };
      if (!response.ok || !payload.insight) {
        setError(payload.error || "Opportunity Insight is temporarily unavailable.");
        return;
      }
      setInsight(payload.insight);
    } catch {
      setError("Opportunity Insight is temporarily unavailable. The opportunity details remain available.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="ai-opportunity-insight"
      className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
      aria-labelledby="ai-opportunity-insight-heading"
    >
      <p className="eyebrow text-[var(--accent-strong)]">AI-assisted</p>
      <h2 id="ai-opportunity-insight-heading" className="mt-2 text-lg font-semibold">
        AI Opportunity Insight
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Grounded in verified listing evidence and your selected profile fields. The official source remains authoritative.
      </p>

      {!isAuthenticated ? (
        <Link href={loginHref} className="button-secondary mt-4">
          Sign in for Opportunity Insight
        </Link>
      ) : !insight ? (
        <button
          type="button"
          onClick={loadInsight}
          disabled={loading}
          className="button-secondary mt-4 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "Preparing insight…" : "Get Opportunity Insight"}
        </button>
      ) : null}

      {error ? <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">{error}</p> : null}

      {insight ? (
        <div className="mt-6 space-y-6 border-t border-[var(--line)] pt-5">
          <p role="status" className="text-xs font-semibold text-[var(--muted)]">
            {insight.mode === "ai"
              ? `AI-assisted result · ${insight.provider}`
              : `Deterministic guidance · ${insight.availabilityReason ? REASON_LABELS[insight.availabilityReason] : "AI unavailable"}`}
          </p>

          <div>
            <h3 className="font-semibold">Why this fits</h3>
            <InsightList items={insight.whyFit} />
          </div>

          <div>
            <h3 className="font-semibold">Eligibility and readiness</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              <span className="mr-2 inline-flex rounded-full border border-[var(--line)] px-2 py-0.5 text-[0.7rem] font-semibold text-[var(--foreground)]">
                Verified evidence
              </span>
              {insight.eligibilityAssessment.summary}
            </p>
            {insight.eligibilityAssessment.evidence.map((evidence) => (
              <blockquote key={evidence} className="mt-3 border-l-2 border-[var(--accent)] pl-3 text-sm leading-6 text-[var(--muted)]">
                {evidence}
              </blockquote>
            ))}
            <InsightList items={insight.readiness} />
          </div>

          <div>
            <h3 className="font-semibold">What is unclear</h3>
            <InsightList items={insight.missingOrUnclear} />
          </div>

          <div>
            <h3 className="font-semibold">Suggested next actions</h3>
            <InsightList items={insight.nextActions} />
          </div>

          <div className="rounded-lg bg-[var(--muted-surface)] p-4">
            <h3 className="font-semibold">Deadline urgency</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{insight.deadlineUrgency.summary}</p>
          </div>

          <div>
            <h3 className="font-semibold">Evidence limitations</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--muted)]">
              {insight.confidence.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
