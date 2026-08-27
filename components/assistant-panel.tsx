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
      className="flex w-full max-w-xl flex-col gap-3 rounded-lg border border-black/[.08] bg-white p-4 text-left dark:border-white/[.145] dark:bg-zinc-950"
    >
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
          className="h-10 w-full rounded-full border border-black/[.10] bg-white px-4 text-sm text-black outline-none transition-colors focus:border-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white/40"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {state === "loading" ? "Thinking…" : "Ask"}
        </button>
      </form>

      {errorText ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {errorText}
        </p>
      ) : null}

      {response ? (
        response.mode === "disabled" ? (
          <p role="status" className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {response.summary}{" "}
            <Link href="/" className="underline underline-offset-4 hover:text-black dark:hover:text-zinc-50">
              Browse all opportunities
            </Link>
          </p>
        ) : (
          <div role="status" className="flex flex-col gap-2">
            <p className="text-sm font-medium text-black dark:text-zinc-50">{response.summary}</p>
            {response.appliedFilters ? (
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
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
                  <Link href={`/opportunities/${r.slug}`} className="text-sm underline underline-offset-4 hover:text-black dark:hover:text-zinc-50">
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
