"use server";

import { randomUUID } from "node:crypto";
import {
  initialSubmissionState,
  validateSubmission,
  type SubmissionFormState,
  type SubmissionInput,
} from "../submission-validation";
import { createSupabaseServerClient } from "./supabase-client";

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return `${base || "opportunity"}-${randomUUID().slice(0, 8)}`;
}

function extractInput(formData: FormData): SubmissionInput {
  const get = (key: keyof SubmissionInput): string =>
    typeof formData.get(key) === "string" ? (formData.get(key) as string) : "";
  return {
    title: get("title"),
    description: get("description"),
    category: get("category"),
    organizationId: get("organizationId"),
    url: get("url"),
    deadline: get("deadline"),
    venueName: get("venueName"),
    address: get("address"),
    city: get("city"),
    region: get("region"),
    country: get("country"),
  };
}

export async function submitOpportunityAction(
  _previousState: SubmissionFormState,
  formData: FormData
): Promise<SubmissionFormState> {
  const input = extractInput(formData);

  const result = validateSubmission(input);
  if (!result.ok) {
    return { status: "error", message: null, errors: result.errors, values: input };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return {
      status: "error",
      message:
        "The submission service is temporarily unavailable. Please try again later.",
      errors: {},
      values: input,
    };
  }

  const categoryRow = await supabase
    .from("categories")
    .select("id")
    .eq("slug", result.value.category)
    .maybeSingle();
  const categoryId = (categoryRow.data as unknown as { id: number } | null)?.id;
  if (!categoryId) {
    return {
      status: "error",
      message: null,
      errors: { category: "Choose a valid category." },
      values: input,
    };
  }

  let organizationId: string | null = null;
  if (result.value.organizationId !== null) {
    const organizationRow = await supabase
      .from("organizations")
      .select("id")
      .eq("id", result.value.organizationId)
      .maybeSingle();
    const existingId = (
      organizationRow.data as unknown as { id: string } | null
    )?.id;
    if (!existingId) {
      return {
        status: "error",
        message: null,
        errors: { organizationId: "Selected organization no longer exists." },
        values: input,
      };
    }
    organizationId = existingId;
  }

  const { error } = await supabase.from("opportunities").insert({
    slug: generateSlug(result.value.title),
    title: result.value.title,
    description: result.value.description,
    category_id: categoryId,
    organization_id: organizationId,
    url: result.value.url,
    deadline: result.value.deadlineIso,
    status: "pending",
    venue_name: result.value.venueName,
    address: result.value.address,
    city: result.value.city,
    region: result.value.region,
    country: result.value.country,
  });

  if (error) {
    console.error("[lib/data] Failed to save submission:", error.message);
    return {
      status: "error",
      message: "We could not save your submission right now. Please try again.",
      errors: {},
      values: input,
    };
  }

  return { status: "success", message: null, errors: {}, values: initialSubmissionState.values };
}
