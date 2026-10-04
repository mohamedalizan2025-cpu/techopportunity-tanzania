"use client";

import { useState } from "react";
import Link from "next/link";

interface AssistantResult {
  id: string;
  slug: string;
  title: string;
  category: string;
  city: string | null;
  region: string | null;
  deadline: string | null;
}

interface AssistantResponse {
  mode: "ai" | "deterministic" | "disabled" | "rate-limited" | "error";
  summary: string;
  appliedFilters: { q: string | null; category: string | null; city: string | null; region: string | null; deadline: string | null; sort: string } | null;
  results: AssistantResult[];
}

export function AssistantPanel() {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    setErrorText(null);
    setState("loading");
    try {
      const res = await fetch("/api/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = (await res.json()) as AssistantResponse;
      setResponse(data);
    } catch {
      setErrorText("The assistant could not be reached. Please try the search filters instead.");
    } finally {
      setState("idle");
    }
  }

  return (
    <section
      aria-label="Opportunity assistant"
      className="flex w-full max-w-xl flex-col gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] p-4 text-left"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--subtle)]">
        Opportunity assistant
      </p>
      <form onSubmit={ask} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="assistant-question" className="sr-only">
          Ask about opportunities
        </label>
        <input
          id="assistant-question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={200}
          placeholder="Ask: scholarships closing soon, tech events in Zanzibar…"
          className="h-10 w-full rounded-md border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] px-6 text-sm font-semibold text-white transition hover:bg-[#07543f] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          {state === "loading" ? "Thinking…" : "Ask"}
        </button>
      </form>

      <p className="text-xs leading-5 text-[var(--subtle)]">
        Searches published opportunities only — it never invents results or
        shows unpublished records.
      </p>

      {errorText ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {errorText}
        </p>
      ) : null}

      {response ? (
        response.mode === "disabled" ? (
            <p role="status" className="text-sm leading-6 text-[var(--muted)]">
              {response.summary}{" "}
              <Link href="/" className="underline underline-offset-4 hover:text-[var(--accent-strong)]">
              Browse all opportunities
            </Link>
          </p>
        ) : (
          <div role="status" className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--foreground)]">{response.summary}</p>
            {response.appliedFilters ? (
              <p className="text-xs uppercase tracking-wide text-[var(--subtle)]">
                Filters:{" "}
                {[
                  response.appliedFilters.q,
                  response.appliedFilters.category,
                  response.appliedFilters.city,
                  response.appliedFilters.region,
                  response.appliedFilters.deadline === "rolling" ? "no deadline" : response.appliedFilters.deadline,
                ]
                  .filter(Boolean)
                  .join(" · ") || "none"}
              </p>
            ) : null}
            <ul className="flex flex-col gap-1">
              {response.results.map((r) => (
                <li key={r.id}>
                  <Link href={`/opportunities/${r.slug}`} className="text-sm underline underline-offset-4 hover:text-[var(--accent-strong)]">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : null}
    </section>
  );
}
