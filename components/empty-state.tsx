import Link from "next/link";

interface EmptyStateProps {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}

export function EmptyState({ title, message, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex w-full flex-col items-start gap-2 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] px-6 py-10 sm:px-8"
    >
      <p className="text-lg font-semibold text-[var(--foreground)]">{title}</p>
      <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">{message}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
