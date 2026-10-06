import { redirect } from "next/navigation";

/** Compatibility alias: the AI matching workspace lives at /for-you. */
export default function AiMatchAliasPage() {
  redirect("/for-you");
}
