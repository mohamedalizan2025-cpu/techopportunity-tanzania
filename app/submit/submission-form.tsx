"use client";

import { useActionState } from "react";
import Link from "next/link";
import { UiIcon } from "@/components/ui-icon";
import { submitOpportunityAction } from "@/lib/data/submit-opportunity";
import { initialSubmissionState } from "@/lib/submission-validation";
import type { LiveCategory } from "@/lib/data/categories";
interface OrganizationOption {
  id: string;
  name: string;
}

const inputBase =
  "mt-1.5 w-full rounded-md border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]";

function fieldClassName(hasError: boolean): string {
  return `${inputBase} ${
    hasError
      ? "border-red-300 focus:border-red-400 dark:border-red-900"
      : "border-[var(--line-strong)] focus:border-[var(--accent)]"
  }`;
}

function Label({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: string;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--foreground)]">
      {children}
      {optional ? (
        <span className="ml-1 font-normal text-[var(--subtle)]">(optional)</span>
      ) : null}
    </label>
  );
}

export function SubmissionForm({
  organizations,
  categories,
}: {
  organizations: OrganizationOption[];
  categories: LiveCategory[];
}) {
  const [state, formAction, isPending] = useActionState(
    submitOpportunityAction,
    initialSubmissionState
  );
  const values = state.values;
  const errors = state.errors;

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-md bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <UiIcon name="check" width="24" height="24" />
        </span>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          Submitted for review
        </h2>
        <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
          Thank you — your opportunity has been received and is now awaiting a
          moderation review. It will appear on the homepage once it is approved.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--line-strong)] bg-[var(--surface)] px-6 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          ← Back to homepage
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.status === "error" && state.message !== null ? (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <Label htmlFor="title">Opportunity title</Label>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={200}
          defaultValue={values.title}
          className={fieldClassName(errors.title !== undefined)}
          placeholder="e.g. National AI Hackathon 2027"
        />
        {errors.title ? (
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errors.title}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={values.description}
          className={fieldClassName(errors.description !== undefined)}
          placeholder="What is it, who can apply, what are the benefits?"
        />
        {errors.description ? (
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {errors.description}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={values.category}
            className={fieldClassName(errors.category !== undefined)}
          >
            <option value="">Select a category…</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category ? (
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {errors.category}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="organizationId" optional>
            Organization
          </Label>
          <select
            id="organizationId"
            name="organizationId"
            defaultValue={values.organizationId}
            className={fieldClassName(errors.organizationId !== undefined)}
          >
            <option value="">No organization / not listed</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
          {errors.organizationId ? (
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {errors.organizationId}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <Label htmlFor="url">Application / info URL</Label>
        <input
          id="url"
          name="url"
          type="url"
          maxLength={2048}
          defaultValue={values.url}
          className={fieldClassName(errors.url !== undefined)}
          placeholder="https://example.org/apply"
        />
        {errors.url ? (
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errors.url}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="deadline" optional>
          Deadline
        </Label>
        <input
          id="deadline"
          name="deadline"
          type="date"
          defaultValue={values.deadline}
          className={fieldClassName(errors.deadline !== undefined)}
        />
        {errors.deadline ? (
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {errors.deadline}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-[var(--subtle)]">
          Leave empty for rolling applications.
        </p>
      </div>

      <fieldset className="rounded-md border border-dashed border-[var(--line-strong)] p-4">
        <legend className="px-1 text-sm font-medium text-[var(--muted)]">
          Location (optional)
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="venueName" optional>
              Venue
            </Label>
            <input
              id="venueName"
              name="venueName"
              type="text"
              maxLength={200}
              defaultValue={values.venueName}
              className={fieldClassName(errors.venueName !== undefined)}
            />
          </div>
          <div>
            <Label htmlFor="city" optional>
              City
            </Label>
            <input
              id="city"
              name="city"
              type="text"
              maxLength={200}
              defaultValue={values.city}
              className={fieldClassName(errors.city !== undefined)}
            />
          </div>
          <div>
            <Label htmlFor="address" optional>
              Address
            </Label>
            <input
              id="address"
              name="address"
              type="text"
              maxLength={200}
              defaultValue={values.address}
              className={fieldClassName(errors.address !== undefined)}
            />
          </div>
          <div>
            <Label htmlFor="region" optional>
              Region
            </Label>
            <input
              id="region"
              name="region"
              type="text"
              maxLength={200}
              defaultValue={values.region}
              className={fieldClassName(errors.region !== undefined)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="country" optional>
              Country
            </Label>
            <input
              id="country"
              name="country"
              type="text"
              maxLength={100}
              defaultValue={values.country}
              className={fieldClassName(errors.country !== undefined)}
            />
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--accent)] px-6 text-sm font-semibold text-white transition hover:bg-[#07543f] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
      >
        {isPending ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
