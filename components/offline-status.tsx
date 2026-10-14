"use client";

import { useEffect, useState } from "react";

type NetState = "online" | "offline" | "reconnecting" | "synced";

/**
 * Lightweight global connectivity indicator. Quiet while online; honest
 * while offline. Fixed to the top so it never covers the phone bottom nav.
 *
 * `navigator.onLine` is only a hint: browsers can report offline transiently
 * (slow TLS/DNS on a fresh domain, captive portals, VPN hiccups) even while
 * the product is reachable, and they do not always fire a later `online`
 * event for a signal that was wrong at mount. A stuck false-offline signal
 * would otherwise reappear on every reload while client navigation stalls
 * elsewhere. So a suspected-offline state is RE-VERIFIED — on mount, on
 * window load, and when the tab becomes visible — with a lightweight
 * same-origin HEAD probe. The banner clears only through the normal
 * reconnecting flow after real reachability evidence; a failed probe keeps
 * the honest offline wording. Nothing here ever hides the banner blindly.
 */
export function OfflineStatus() {
  const [state, setState] = useState<NetState>(() =>
    typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online"
  );

  useEffect(() => {
    let stateRef: NetState =
      typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online";
    const setTracked = (next: NetState) => {
      stateRef = next;
      setState(next);
    };
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let syncTimer: ReturnType<typeof setTimeout> | null = null;
    let probeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleOnline = () => {
      if (hideTimer) clearTimeout(hideTimer);
      if (syncTimer) clearTimeout(syncTimer);
      setTracked("reconnecting");
      syncTimer = setTimeout(() => setTracked("synced"), 1200);
      hideTimer = setTimeout(() => setTracked("online"), 4200);
    };
    const probeReachability = async (): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const response = await fetch("/", {
            method: "HEAD",
            cache: "no-store",
            signal: controller.signal,
          });
          return response.ok;
        } finally {
          clearTimeout(timeout);
        }
      } catch {
        return false;
      }
    };
    // Re-verify a suspected-offline signal with real evidence. Never clears
    // the banner without it: failure (or abort) keeps the offline state.
    const reverifyOffline = () => {
      if (stateRef !== "offline") return;
      if (typeof navigator !== "undefined" && navigator.onLine) {
        handleOnline();
        return;
      }
      void probeReachability().then((reachable) => {
        if (reachable && stateRef === "offline") handleOnline();
      });
    };
    const onOffline = () => setTracked("offline");
    const onVisible = () => {
      if (document.visibilityState === "visible") reverifyOffline();
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("load", reverifyOffline);
    document.addEventListener("visibilitychange", onVisible);
    // Deferred so the probe never competes with hydration/data requests.
    probeTimer = setTimeout(reverifyOffline, 1500);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("load", reverifyOffline);
      document.removeEventListener("visibilitychange", onVisible);
      if (hideTimer) clearTimeout(hideTimer);
      if (syncTimer) clearTimeout(syncTimer);
      if (probeTimer) clearTimeout(probeTimer);
    };
  }, []);

  if (state === "online") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-2"
    >
      <p
        className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-md border px-4 py-2 text-xs font-semibold shadow-sm ${
          state === "offline"
            ? "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--foreground)]"
            : state === "reconnecting"
              ? "border-[var(--line-strong)] bg-[var(--warning-soft)] text-[var(--warning)]"
              : "border-[var(--line)] bg-[var(--verified-soft)] text-[var(--verified)]"
        }`}
      >
        <span aria-hidden="true">
          {state === "offline" ? "○" : state === "reconnecting" ? "◌" : "●"}
        </span>
        {state === "offline"
          ? "Offline — showing cached information"
          : state === "reconnecting"
            ? "Connection restored — updating…"
            : "Updated — fresh information where available"}
      </p>
    </div>
  );
}
