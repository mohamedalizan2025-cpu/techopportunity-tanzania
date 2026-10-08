"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { opportunityHref } from "@/lib/opportunity-presentation";
import {
  ASK_HISTORY_MAX_SLUGS,
  ASK_HISTORY_MAX_TOTAL_CHARS,
  ASK_HISTORY_MAX_TURNS,
  ASK_HISTORY_MAX_TURN_CHARS,
  type AskAnswer,
} from "@/lib/ask/contract";

const STARTER_QUESTIONS = [
  "Find internships",
  "What is AI Match?",
  "How are opportunities verified?",
];

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  answer?: AskAnswer;
}

type SpeechRecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
  }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

/**
 * Continuous Ask AI chat. Ephemeral by design: the transcript lives in
 * client state only while this page is open (refresh/navigation clears
 * it) — no browser storage APIs and no server-side chat storage.
 * Each submit sends the question plus a bounded recent window
 * (history turns + prior opportunity refs) that the server re-sanitizes
 * and re-grounds against the current published corpus.
 */
export function AskForm({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const idRef = useRef(1);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageRef = useRef<HTMLLIElement>(null);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);
  const baseDraftRef = useRef("");

  useEffect(() => {
    // Deferred past hydration: capability probing must not run during SSR,
    // and state updates belong in a callback, not the effect body.
    const frame = requestAnimationFrame(() => {
      setVoiceSupported(getSpeechRecognition() !== null);
    });
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches
    ) {
      composerRef.current?.focus();
    }
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lastMessageRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [messages.length, sending]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Recognition may already be stopped; teardown must never throw.
      }
    };
  }, []);

  function buildContext(prior: ChatMessage[]) {
    const turns = prior
      .slice(-ASK_HISTORY_MAX_TURNS)
      .map((message) => ({
        role: message.role,
        text: message.text.slice(0, ASK_HISTORY_MAX_TURN_CHARS),
      }));
    let total = turns.reduce((sum, turn) => sum + turn.text.length, 0);
    while (turns.length > 0 && total > ASK_HISTORY_MAX_TOTAL_CHARS) {
      const dropped = turns.shift();
      total -= dropped?.text.length ?? 0;
    }
    const slugs: string[] = [];
    for (const message of prior) {
      for (const slug of message.answer?.opportunityRefs ?? []) {
        if (slugs.length >= ASK_HISTORY_MAX_SLUGS) break;
        if (!slugs.includes(slug)) slugs.push(slug);
      }
      if (slugs.length >= ASK_HISTORY_MAX_SLUGS) break;
    }
    return { history: turns, contextSlugs: slugs };
  }

  async function sendQuestion(raw: string) {
    const question = raw.trim();
    if (question.length < 4 || sending) return;
    setError(null);
    setSending(true);
    const userMessage: ChatMessage = { id: idRef.current++, role: "user", text: question };
    const context = buildContext(messages);
    setMessages((previous) => [...previous, userMessage]);
    setDraft("");
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, ...context }),
      });
      const payload = (await response.json()) as {
        answer?: AskAnswer;
        error?: string;
      };
      if (!response.ok || !payload.answer) {
        setError(payload.error || "Ask is temporarily unavailable. Try again.");
      } else {
        const answer = payload.answer;
        setMessages((previous) => [
          ...previous,
          { id: idRef.current++, role: "assistant", text: answer.text, answer },
        ]);
      }
    } catch {
      setError("Ask is temporarily unavailable. Check your connection and try again.");
    } finally {
      setSending(false);
      composerRef.current?.focus();
    }
  }

  async function askQuestion(event: React.FormEvent) {
    event.preventDefault();
    await sendQuestion(draft);
  }

  function toggleListening() {
    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        setListening(false);
      }
      return;
    }
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setVoiceSupported(false);
      return;
    }
    setVoiceNote(null);
    baseDraftRef.current = draft;
    const recognition = new Recognition();
    recognition.lang =
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      const base = baseDraftRef.current;
      setDraft(transcript ? `${base}${base && !base.endsWith(" ") ? " " : ""}${transcript}` : base);
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceNote("Microphone access was denied. You can still type your question.");
      } else {
        setVoiceNote("Voice input did not work. You can still type your question.");
      }
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setVoiceNote("Voice input did not work. You can still type your question.");
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

  const canSend = draft.trim().length >= 4 && !sending;

  return (
    <div className="mt-6 min-w-0">
      {messages.length === 0 ? (
        <div className="flex flex-wrap gap-2" aria-label="Starter questions">
          {STARTER_QUESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={sending}
              onClick={() => sendQuestion(suggestion)}
              className="inline-flex min-h-11 items-center rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] disabled:opacity-60"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <ol className="mt-4 min-w-0 space-y-4" aria-label="Conversation with Ask AI">
        {messages.map((message, index) =>
          message.role === "user" ? (
            <li
              key={message.id}
              ref={index === messages.length - 1 ? lastMessageRef : undefined}
              className="flex justify-end"
            >
              <p className="max-w-[85%] min-w-0 rounded-md rounded-br-none bg-[var(--accent-soft)] px-4 py-3 text-sm leading-6 break-words text-[var(--foreground)] [overflow-wrap:anywhere] sm:max-w-[75%]">
                {message.text}
              </p>
            </li>
          ) : (
            <li
              key={message.id}
              ref={index === messages.length - 1 ? lastMessageRef : undefined}
              className="min-w-0 rounded-md border border-[var(--line)] bg-[var(--surface)] p-5"
            >
              <AssistantMessage message={message} />
            </li>
          )
        )}
        {sending ? (
          <li aria-hidden="true">
            <p className="flex min-h-6 items-center gap-1 text-sm text-[var(--muted)]">
              <span className="motion-safe:animate-pulse">Ask AI is thinking…</span>
            </p>
          </li>
        ) : null}
      </ol>

      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {sending ? "Sending your question." : null}
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {voiceNote ? (
        <p role="status" className="mt-3 text-xs leading-5 text-[var(--muted)]">
          {voiceNote}
        </p>
      ) : null}

      <div className="sticky bottom-[calc(60px+env(safe-area-inset-bottom))] z-30 -mx-5 border-t border-[var(--line)] bg-[var(--background)] px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <form onSubmit={askQuestion} className="flex min-w-0 items-end gap-2">
          <label htmlFor="ask-question" className="sr-only">
            Ask Ask AI a question
          </label>
          <textarea
            id="ask-question"
            ref={composerRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendQuestion(draft);
              }
            }}
            rows={2}
            maxLength={500}
            placeholder="Ask about opportunities or using Tech Opportunity…"
            className="auth-input min-w-0 flex-1"
            aria-describedby="ask-composer-help"
          />
          {voiceSupported ? (
            <button
              type="button"
              onClick={toggleListening}
              aria-label={listening ? "Stop voice input" : "Start voice input"}
              aria-pressed={listening}
              title={
                listening
                  ? "Stop listening"
                  : "Speak your question (uses your browser's speech recognition)"
              }
              className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border px-2 transition ${
                listening
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="17" x2="12" y2="22" />
              </svg>
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send question"
            title="Send (Enter)"
            className="button-primary shrink-0 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </form>
        <p id="ask-composer-help" className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Enter sends · Shift+Enter adds a line · answers use verified information only.
        </p>
      </div>
    </div>
  );
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  const answer = message.answer;
  if (!answer) {
    return (
      <p className="min-w-0 text-sm leading-6 break-words text-[var(--foreground)] [overflow-wrap:anywhere]">
        {message.text}
      </p>
    );
  }
  const light = answer.availabilityReason === "assistant" || answer.availabilityReason === "faq";
  return (
    <div className="min-w-0">
      {answer.mode === "ai" ? (
        <p className="text-xs font-semibold text-[var(--muted)]">AI-assisted answer</p>
      ) : null}
      <p className="mt-1 min-w-0 text-sm leading-6 break-words text-[var(--foreground)] [overflow-wrap:anywhere]">
        {answer.text}
      </p>
      {answer.opportunityRefs.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {answer.opportunityRefs.map((slug) => (
            <li key={slug} className="min-w-0">
              <Link
                href={opportunityHref(slug, "/ask")}
                className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold break-words text-[var(--accent-strong)] underline-offset-2 hover:underline [overflow-wrap:anywhere]"
              >
                View opportunity →
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {answer.sources.length > 0 ? (
        <p className="mt-3 min-w-0 text-xs leading-5 break-words text-[var(--muted)] [overflow-wrap:anywhere]">
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
      {!light && answer.limitations.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {answer.limitations.map((limitation) => (
            <li key={limitation} className="min-w-0 text-xs leading-5 break-words text-[var(--muted)] [overflow-wrap:anywhere]">
              {limitation}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
