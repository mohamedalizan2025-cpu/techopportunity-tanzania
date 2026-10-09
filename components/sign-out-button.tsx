"use client";

import { clearAllPrivateOfflineCache } from "@/components/offline-seeds";
import { logOutAction } from "@/lib/data/auth-actions";

/**
 * Sign-out that clears account-specific offline cache first: no private
 * cross-account leakage, public opportunity cache may remain.
 */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form
      action={logOutAction}
      onSubmit={() => {
        clearAllPrivateOfflineCache();
      }}
    >
      <button type="submit" className={className ?? "nav-link"}>
        Sign out
      </button>
    </form>
  );
}
