"use client";

import { useEffect } from "react";

/** Registers the service worker once. Static shell only — see public/sw.js. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.hostname !== "localhost" && window.location.protocol !== "https:") return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration is best-effort; the product works fully without it.
      });
    });
  }, []);
  return null;
}
