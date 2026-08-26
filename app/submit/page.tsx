import type { Metadata } from "next";
import Link from "next/link";
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

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:py-16">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← All opportunities
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
          Submit an opportunity
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Know a hackathon, scholarship, competition, internship or tech event
          that Tanzanian students should not miss? Share it below — every
          submission is reviewed before it is published.
        </p>

        <div className="mt-8 rounded-lg border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950 sm:p-6">
          <SubmissionForm organizations={organizations} />
        </div>
      </main>
    </div>
  );
}
