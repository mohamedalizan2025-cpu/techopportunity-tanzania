"use client";

import { useEffect, useState } from "react";

type NetState = "online" | "offline" | "reconnecting" | "synced";

/**
 * Lightweight global connectivity indicator. Quiet while online; honest
 * while offline. Fixed to the top so it never covers the phone bottom nav.
 */
export function OfflineStatus() {
  const [state, setState] = useState<NetState>(() =>
    typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online"
  );

  useEffect(() => {
    const onOffline = () => setState("offline");
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let syncTimer: ReturnType<typeof setTimeout> | null = null;
    const handleOnline = () => {
      setState("reconnecting");
      syncTimer = setTimeout(() => setState("synced"), 1200);
      hideTimer = setTimeout(() => setState("online"), 4200);
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", handleOnline);
      if (hideTimer) clearTimeout(hideTimer);
      if (syncTimer) clearTimeout(syncTimer);
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
