"use client";

import type { ReactNode } from "react";
import { UiIcon } from "./ui-icon";

export function MobileNavigation({ children }: { children: ReactNode }) {
  return (
    <details
      className="mobile-menu sm:hidden"
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
      <summary className="button-secondary min-h-11 px-3">
        Menu <UiIcon name="chevron" />
      </summary>
      <nav aria-label="Mobile navigation" className="menu-panel">
        {children}
      </nav>
    </details>
  );
}
