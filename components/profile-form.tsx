"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveTalentProfileAction } from "@/lib/data/talent-profile-actions";
import { initialProfileMutationState } from "@/lib/profile-state";
import {
  CAREER_LEVELS,
  CAREER_LEVEL_LABELS,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
  MAX_FIELD_DISCIPLINE,
  MAX_GOALS,
  type TalentProfile,
} from "@/lib/personalization";
import { SECTORS, SECTOR_LABELS } from "@/lib/taxonomy";
import { OPPORTUNITY_CATEGORIES } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/category-labels";
import { TANZANIA_REGIONS } from "@/lib/tanzania-regions";

const fieldLabel = "block text-sm font-semibold text-[var(--foreground)]";
const helpText = "mt-1.5 text-xs leading-5 text-[var(--subtle)]";

function ChoiceChip({
  name,
  value,
  label,
  checked,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label
      className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
        checked
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
          : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]"
      }`}
    >
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        className="h-4 w-4 accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}

export function ProfileForm({ profile }: { profile: TalentProfile }) {
  const [state, action, isPending] = useActionState(
    saveTalentProfileAction,
    initialProfileMutationState
  );

  return (
    <form action={action} className="flex flex-col gap-8" noValidate>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          tabIndex={-1}
          className={`rounded-xl border p-3 text-sm ${
            state.status === "error"
              ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              : "border-[var(--line-strong)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-6">
        <legend className="section-heading">Core profile</legend>
        <p className="-mt-4 text-sm text-[var(--muted)]">
          The essentials for personalized recommendations. Every field is
          optional — add what you want and skip the rest.
        </p>

        <div>
          <label htmlFor="careerLevel" className={fieldLabel}>
            Education / career level
          </label>
          <select
            id="careerLevel"
            name="careerLevel"
            defaultValue={profile.careerLevel ?? ""}
            className="auth-input"
          >
            <option value="">Prefer not to say</option>
            {CAREER_LEVELS.map((level) => (
              <option key={level} value={level}>
                {CAREER_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="fieldDiscipline" className={fieldLabel}>
            Field / discipline
          </label>
          <input
            id="fieldDiscipline"
            name="fieldDiscipline"
            type="text"
            maxLength={MAX_FIELD_DISCIPLINE}
            defaultValue={profile.fieldDiscipline ?? ""}
            placeholder="e.g. Computer Science, Public Health"
            className="auth-input"
          />
        </div>

        <div>
          <span className={fieldLabel}>Sectors / interests</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {SECTORS.map((sector) => (
              <ChoiceChip
                key={sector}
                name="sectors"
                value={sector}
                label={SECTOR_LABELS[sector]}
                checked={profile.sectors.includes(sector)}
              />
            ))}
          </div>
        </div>

        <div>
          <span className={fieldLabel}>Preferred opportunity types</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {OPPORTUNITY_CATEGORIES.filter((category) => category !== "other").map(
              (category) => (
                <ChoiceChip
                  key={category}
                  name="preferredTypes"
                  value={category}
                  label={CATEGORY_LABELS[category]}
                  checked={profile.preferredTypes.includes(category)}
                />
              )
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-6 border-t border-[var(--line)] pt-8">
        <legend className="section-heading">Optional details</legend>
        <p className="-mt-4 text-sm text-[var(--muted)]">
          Add these anytime to sharpen your recommendations. They stay private
          to your account.
        </p>

        <div>
          <label htmlFor="skills" className={fieldLabel}>
            Skills
          </label>
          <input
            id="skills"
            name="skills"
            type="text"
            defaultValue={profile.skills.join(", ")}
            placeholder="e.g. Python, data analysis, field research"
            className="auth-input"
          />
          <p className={helpText}>Separate skills with commas.</p>
        </div>

        <div>
          <label htmlFor="region" className={fieldLabel}>
            Location (region)
          </label>
          <select
            id="region"
            name="region"
            defaultValue={profile.region ?? ""}
            className="auth-input"
          >
            <option value="">Anywhere</option>
            {TANZANIA_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="experienceLevel" className={fieldLabel}>
            Experience level
          </label>
          <select
            id="experienceLevel"
            name="experienceLevel"
            defaultValue={profile.experienceLevel ?? ""}
            className="auth-input"
          >
            <option value="">Prefer not to say</option>
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {EXPERIENCE_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="goals" className={fieldLabel}>
            Career / research / startup goals
          </label>
          <textarea
            id="goals"
            name="goals"
            rows={3}
            maxLength={MAX_GOALS}
            defaultValue={profile.goals ?? ""}
            placeholder="What are you working toward?"
            className="auth-input"
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="button-primary disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save profile"}
        </button>
        <Link href="/" className="button-secondary">
          Skip for now — continue exploring
        </Link>
      </div>
      <p className={helpText}>
        Your profile is private to your account. It is never shared with
        organizations and never changes what you can see in Explore.
      </p>
    </form>
  );
}
