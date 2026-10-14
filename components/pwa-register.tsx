"use client";

import { useEffect } from "react";

/** Registers the service worker once. Static shell only — see public/sw.js. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.hostname !== "localhost" && window.location.protocol !== "https:") return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration is best-effort; the product works fully without it.
      });
    };
    // Hydration can finish after window load already fired; then a
    // load-only listener would never run and the worker would stay
    // unregistered until the next navigation.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);
  }, []);
  return null;
}
