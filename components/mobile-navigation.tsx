"use client";

import { useRef, useState, type ReactNode } from "react";
import { UiIcon } from "./ui-icon";

export function MobileNavigation({ children }: { children: ReactNode }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const panelId = "mobile-navigation-panel";
  return (
    <details
      ref={detailsRef}
      className="mobile-menu sm:hidden"
      onToggle={(event) => setOpen(event.currentTarget.open)}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a"))
          event.currentTarget.open = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.currentTarget.open = false;
          event.currentTarget.querySelector("summary")?.focus();
        }
      }}
    >
      <summary
        className="button-secondary min-h-11 px-3"
        aria-expanded={open}
        aria-controls={panelId}
      >
        Menu <UiIcon name="chevron" />
      </summary>
      <nav id={panelId} aria-label="Mobile navigation" className="menu-panel">
        {children}
      </nav>
    </details>
  );
}
