import Link from "next/link";
import { UiIcon } from "./ui-icon";

interface EmptyStateProps {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}

export function EmptyState({
  title,
  message,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div role="status" className="state-panel w-full">
      <span className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-[var(--muted-surface)] text-[var(--muted)]">
        <UiIcon name="search" width="24" height="24" />
      </span>
      <p className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
        {title}
      </p>
      <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
        {message}
      </p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="button-primary mt-2">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
