"use client";

import { useEffect, useState } from "react";
import { UiIcon } from "./ui-icon";

const DISMISSED_KEY = "techopportunity-pwa-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !("MSStream" in window);
}

/**
 * Tasteful install control for the public homepage only. Shows only when
 * the browser reports installability (beforeinstallprompt) or on iOS with
 * manual guidance. Dismissal persists; installed/standalone never prompts.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Deferred (not synchronous) so mount-time evaluation never cascades renders.
    const timer = setTimeout(() => {
      if (cancelled) return;
      if (isStandalone()) {
        setInstalled(true);
        return;
      }
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(DISMISSED_KEY);
      } catch {
        stored = "1";
      }
      if (!stored) setDismissed(false);
    }, 0);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || dismissed) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Private mode: hiding for this session is the best we can do.
    }
    setDismissed(true);
    setDeferred(null);
  };

  async function install() {
    const promptEvent = deferred as (Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> }) | null;
    if (!promptEvent?.prompt) {
      dismiss();
      return;
    }
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice && choice.outcome !== "dismissed") setInstalled(true);
    } catch {
      // Declined or failed prompts hide cleanly without an error state.
    } finally {
      dismiss();
    }
  }

  // iOS/Safari: no programmatic prompt exists; show one-line manual guidance.
  if (!deferred && isIos()) {
    return (
      <div className="mt-4 rounded-md border border-[var(--line)] bg-[var(--surface)] p-4 text-sm leading-6">
        <p className="font-semibold">Install Tech Opportunity</p>
        <p className="mt-1 text-[var(--muted)]">
          On iPhone, tap Share then “Add to Home Screen” to install this app.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--muted)] underline-offset-4 hover:underline"
        >
          Not now
        </button>
      </div>
    );
  }

  if (!deferred) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] p-4">
      <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[var(--brand-deep)] text-[var(--gold)]">
        <UiIcon name="arrow" width="20" height="20" className="-rotate-45" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Install Tech Opportunity</p>
        <p className="text-xs leading-5 text-[var(--muted)]">
          Faster access to verified opportunities, online only for fresh deadlines.
        </p>
      </div>
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--brand)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)]"
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[var(--muted)] underline-offset-4 hover:underline"
      >
        Not now
      </button>
    </div>
  );
}
