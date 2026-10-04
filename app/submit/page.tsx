import type { Metadata } from "next";
import Link from "next/link";
import { listLiveCategories } from "@/lib/data/categories";
import { listOrganizationOptions } from "@/lib/data/opportunities";
import { SubmissionForm } from "./submission-form";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Submit an opportunity · TechOpportunity Tanzania",
  description:
    "Share a hackathon, scholarship, competition, internship, fellowship, grant or tech event with Tanzanian students and young innovators.",
};

export default async function SubmitPage() {
  const organizations = await listOrganizationOptions();
  // Same live taxonomy as the homepage hub: the form offers exactly the
  // categories seeded in the live database. When 0004/0010 land, their
  // options appear automatically — no frontend change.
  const categories = await listLiveCategories();

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]">
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:py-16">
        <Link
          href="/"
          className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          ← All opportunities
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Submit an opportunity
        </h1>
        <p className="mt-3 text-base leading-7 text-[var(--muted)]">
          Know a hackathon, scholarship, competition, internship or tech event
          that Tanzanian students should not miss? Share it below — every
          submission is reviewed by a person before it is published, and
          nothing appears publicly until it passes.
        </p>

        <div className="mt-8 rounded-md border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <SubmissionForm organizations={organizations} categories={categories} />
        </div>
      </main>
    </div>
  );
}
