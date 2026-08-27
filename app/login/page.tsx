import type { Metadata } from "next";
import Link from "next/link";
import { sanitizeNextPath } from "@/lib/staff-form-state";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Staff sign-in · TechOpportunity Tanzania",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(params.next);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main id="main-content" tabIndex={-1} className="flex w-full max-w-sm flex-1 flex-col justify-center py-16">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← All opportunities
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Staff sign-in
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          For moderators and administrators reviewing community submissions.
        </p>

        <div className="mt-8 rounded-lg border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <LoginForm nextPath={nextPath} />
        </div>
      </main>
    </div>
  );
}
