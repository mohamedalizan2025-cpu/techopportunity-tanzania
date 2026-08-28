import { OPPORTUNITY_CATEGORIES, type OpportunityCategory } from "./types";

export interface SubmissionInput {
  title: string;
  description: string;
  category: string;
  organizationId: string;
  url: string;
  deadline: string;
  venueName: string;
  address: string;
  city: string;
  region: string;
  country: string;
}

export type SubmissionErrors = Partial<Record<keyof SubmissionInput, string>>;

export interface ValidatedSubmission {
  title: string;
  description: string;
  category: OpportunityCategory;
  organizationId: string | null;
  url: string;
  deadlineIso: string | null;
  venueName: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
}

export type SubmissionValidationResult =
  | { ok: true; value: ValidatedSubmission }
  | { ok: false; errors: SubmissionErrors };

export interface SubmissionFormState {
  status: "idle" | "success" | "error";
  message: string | null;
  errors: SubmissionErrors;
  values: SubmissionInput;
}

export const initialSubmissionState: SubmissionFormState = {
  status: "idle",
  message: null,
  errors: {},
  values: {
    title: "",
    description: "",
    category: "",
    organizationId: "",
    url: "",
    deadline: "",
    venueName: "",
    address: "",
    city: "",
    region: "",
    country: "",
  },
};

const MAX_LOCATION_LENGTH = 200;

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateSubmission(
  input: SubmissionInput
): SubmissionValidationResult {
  const errors: SubmissionErrors = {};

  const title = input.title.trim();
  if (title.length < 3 || title.length > 200) {
    errors.title = "Title must be between 3 and 200 characters.";
  }

  const description = input.description.trim();
  if (description.length === 0) {
    errors.description = "Description is required.";
  } else if (description.length > 10000) {
    errors.description = "Description must be at most 10,000 characters.";
  }

  if (!(OPPORTUNITY_CATEGORIES as readonly string[]).includes(input.category)) {
    errors.category = "Choose a valid category.";
  }

  let normalizedUrl: string | null = null;
  const trimmedUrl = input.url.trim();
  try {
    const parsed = new URL(trimmedUrl);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      normalizedUrl = parsed.toString();
    }
  } catch {}
  if (normalizedUrl === null) {
    errors.url =
      "Enter a valid application URL starting with http:// or https://.";
  }

  let deadlineIso: string | null = null;
  const trimmedDeadline = input.deadline.trim();
  if (trimmedDeadline !== "") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDeadline)) {
      const candidate = new Date(`${trimmedDeadline}T23:59:59Z`);
      const year = Number(trimmedDeadline.slice(0, 4));
      if (Number.isNaN(candidate.getTime()) || year < 2020 || year > 2100) {
        errors.deadline = "Enter a realistic deadline date.";
      } else {
        deadlineIso = candidate.toISOString();
      }
    } else {
      errors.deadline = "Enter a valid deadline date.";
    }
  }

  const venueName = optionalText(input.venueName);
  const address = optionalText(input.address);
  const city = optionalText(input.city);
  const region = optionalText(input.region);
  const locationFields: [keyof SubmissionInput, string | null][] = [
    ["venueName", venueName],
    ["address", address],
    ["city", city],
    ["region", region],
  ];
  for (const [field, value] of locationFields) {
    if (value !== null && value.length > MAX_LOCATION_LENGTH) {
      errors[field] = "This value is too long (max 200 characters).";
    }
  }

  // Country honesty: an empty field means UNKNOWN, never "Tanzania".
  const country = optionalText(input.country);
  if (country !== null && country.length > 100) {
    errors.country = "Country name is too long.";
  }

  const organizationId = optionalText(input.organizationId);
  if (organizationId !== null && !UUID_PATTERN.test(organizationId)) {
    errors.organizationId = "Invalid organization selection.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      title,
      description,
      category: input.category as OpportunityCategory,
      organizationId,
      url: normalizedUrl as string,
      deadlineIso,
      venueName,
      address,
      city,
      region,
      country,
    },
  };
}
