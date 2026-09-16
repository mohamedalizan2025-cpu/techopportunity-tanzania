import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getTalentProfile } from "@/lib/data/talent-profile";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";

export const metadata: Metadata = {
  title: "Your profile | Tech Opportunity",
  description:
    "Add optional details to personalize your For You recommendations. Explore stays open to everyone.",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?next=%2Fprofile");

  const { available, profile } = await getTalentProfile(user);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex-1 bg-[var(--background)]"
    >
      <section className="border-b border-[var(--line)] bg-[var(--hero)]">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            Your account
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
            Build your profile
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Tell us a little about yourself and we&apos;ll order your{" "}
            <span className="font-semibold text-[var(--foreground)]">
              For You
            </span>{" "}
            feed with clear reasons for every suggestion. This is optional —
            Explore always shows the complete trusted list, with or without a
            profile.
          </p>
        </div>
      </section>

      <section aria-labelledby="profile-form-heading">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
          <h2 id="profile-form-heading" className="sr-only">
            Progressive profile
          </h2>
          {available ? (
            <ProfileForm profile={profile} />
          ) : (
            <div
              role="alert"
              className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
            >
              Personalized profiles are temporarily unavailable. Your public
              browsing experience in Explore is unaffected.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
