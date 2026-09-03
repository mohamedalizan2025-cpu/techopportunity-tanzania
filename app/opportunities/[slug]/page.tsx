import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OpportunityDetail } from "@/components/opportunity-detail";
import { getOpportunityBySlug } from "@/lib/data/opportunities";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const opportunity = await getOpportunityBySlug(slug);
  if (!opportunity) return { title: "Opportunity not found" };
  return {
    title: `${opportunity.title} | TechOpportunity Tanzania`,
    description: opportunity.description.slice(0, 160),
  };
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const opportunity = await getOpportunityBySlug(slug);

  if (!opportunity) notFound();

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)] font-sans">
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-16">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--muted-surface)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <span aria-hidden="true" className="mr-2">←</span> All opportunities
        </Link>

        <div className="mt-5 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_20px_60px_rgba(18,48,34,0.08)] sm:p-9">
          <OpportunityDetail opportunity={opportunity} />
        </div>
      </main>
    </div>
  );
}
