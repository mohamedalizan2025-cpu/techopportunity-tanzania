interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex max-w-md flex-col items-center gap-2 rounded-lg border border-dashed border-black/[.15] px-6 py-10 dark:border-white/[.2]"
    >
      <p className="text-base font-medium text-black dark:text-zinc-50">{title}</p>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{message}</p>
    </div>
  );
}
