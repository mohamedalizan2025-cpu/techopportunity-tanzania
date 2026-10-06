"use server";

import { redirect } from "next/navigation";
import {
  parseDeletionConfirmation,
  type AccountDeletionState,
} from "../account-deletion-state";
import { getAuthenticatedUser } from "./supabase-auth";

/**
 * Self-service deletion of the caller's own account.
 *
 * Safety properties (all regression-guarded):
 * - the target is ALWAYS the authenticated session (`auth.uid()` inside
 *   `request_own_account_deletion()`); the form carries no identity field
 *   and this action reads none, so A cannot delete B and no foreign UUID
 *   can redirect deletion;
 * - no service-role key and no Auth Admin API in the product flow — the
 *   scoped SECURITY DEFINER function is the only deletion path;
 * - no generic admin endpoint: this is a fixed self-deletion, never a
 *   delete-by-id operation;
 * - fail closed: any failure returns an error without claiming success.
 */
export async function deleteOwnAccountAction(
  _previousState: AccountDeletionState,
  formData: FormData
): Promise<AccountDeletionState> {
  if (!parseDeletionConfirmation(formData)) {
    return {
      status: "error",
      message: "Type DELETE exactly to confirm account deletion.",
    };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await user.client.rpc("request_own_account_deletion");
  if (error) {
    console.error("[lib/data] Account deletion failed:", error.message);
    return {
      status: "error",
      message: "Your account could not be deleted. Please try again.",
    };
  }

  try {
    await user.client.auth.signOut();
  } catch {
    // The identity row is already gone, so the session is dead
    // server-side; cookie clearing is best-effort from here.
  }
  redirect("/login?deleted=1");
}
