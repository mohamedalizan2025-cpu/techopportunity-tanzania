/**
 * Self-service account deletion state (pre-pilot P0C).
 *
 * The form carries NO user identity: deletion always applies to the
 * authenticated session, derived server-side. There is deliberately no
 * identity field to parse, so no foreign UUID can redirect deletion.
 * Confirmation is the literal word DELETE, typed by the user.
 */

export const ACCOUNT_DELETION_CONFIRMATION = "DELETE";

export interface AccountDeletionState {
  status: "idle" | "success" | "error";
  message: string | null;
}

export const initialAccountDeletionState: AccountDeletionState = {
  status: "idle",
  message: null,
};

export function parseDeletionConfirmation(formData: FormData): boolean {
  return formData.get("confirmation") === ACCOUNT_DELETION_CONFIRMATION;
}
