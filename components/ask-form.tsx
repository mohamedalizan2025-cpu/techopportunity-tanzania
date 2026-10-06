"use client";

import Link from "next/link";
import { useState } from "react";
import { opportunityHref } from "@/lib/opportunity-presentation";
import type { AskAnswer } from "@/lib/ask/contract";

const SUGGESTED_QUESTIONS = [
  "How does Tech Opportunity verify opportunities?",
  "What does Tanzanian access evidenced mean?",
  "How does AI Match work?",
  "How do I track an application?",
  "How do I report incorrect information?",
  "How do I delete my account?",
];

/**
 * Custom-question form for Ask Tech Opportunity. Fetches only on explicit
 * submit — never on render — and posts the question text only. Suggested
 * help answers are rendered server-side on the page itself.
 */
export function AskForm({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function askQuestion(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const payload = (await response.json()) as {
        answer?: AskAnswer;
        error?: string;
      };
      if (!response.ok || !payload.answer) {
        setError(payload.error || "Ask is temporarily unavailable.");
        return;
      }
      setAnswer(payload.answer);
    } catch {
      setError("Ask is temporarily unavailable. The suggested help below still applies.");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mt-6 rounded-md border border-[var(--line)] bg-[var(--surface)] p-5">
        <p className="font-semibold text-[var(--foreground)]">Have your own question?</p>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          Custom questions need an account so fair-use limits apply.
        </p>
        <Link href="/login?next=%2Fask" className="button-secondary mt-4">
          Sign in to ask
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <form onSubmit={askQuestion} className="flex flex-col gap-3">
        <label
          htmlFor="ask-question"
          className="text-sm font-semibold text-[var(--foreground)]"
        >
          Ask a question...
        </label>
        <textarea
          id="ask-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Which internships are open? What is the deadline for…?"
          className="auth-input"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || question.trim().length < 4}
            className="button-primary disabled:opacity-60"
          >
            {loading ? "Asking…" : "Ask"}
          </button>
          <span className="text-xs text-[var(--muted)]">
            Answers use verified information only.
          </span>
        </div>
      </form>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested questions">
        {SUGGESTED_QUESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setQuestion(suggestion)}
            className="inline-flex min-h-11 items-center rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {answer ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 space-y-4 rounded-md border border-[var(--line)] bg-[var(--surface)] p-5"
        >
          <p className="text-xs font-semibold text-[var(--muted)]">
            {answer.mode === "ai"
              ? "AI-assisted answer based on verified information"
              : "Guidance from verified information"}
          </p>
          <p className="text-sm leading-6 text-[var(--foreground)]">{answer.text}</p>
          {answer.opportunityRefs.length > 0 ? (
            <ul className="space-y-2">
              {answer.opportunityRefs.map((slug) => (
                <li key={slug}>
                  <Link
                    href={opportunityHref(slug, "/ask")}
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline"
                  >
                    View opportunity →
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {answer.sources.length > 0 ? (
            <p className="text-xs leading-5 text-[var(--muted)]">
              Sources:{" "}
              {answer.sources.map((source, index) => (
                <span key={source}>
                  {index > 0 ? " · " : null}
                  <Link href={source} className="font-semibold underline-offset-2 hover:underline">
                    {source}
                  </Link>
                </span>
              ))}
            </p>
          ) : null}
          <ul className="space-y-1">
            {answer.limitations.map((limitation) => (
              <li key={limitation} className="text-xs leading-5 text-[var(--muted)]">
                {limitation}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
