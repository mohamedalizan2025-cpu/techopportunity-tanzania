export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col items-center gap-8 py-24" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading opportunities…</span>
        <div className="h-8 w-64 animate-pulse rounded-lg bg-black/[.06] dark:bg-white/[.08]" />
        <div className="h-10 w-full max-w-xl animate-pulse rounded-full bg-black/[.06] dark:bg-white/[.08]" />
        <ul className="flex w-full flex-col gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <li
              key={i}
              className="h-20 w-full animate-pulse rounded-lg border border-transparent bg-black/[.04] dark:bg-white/[.05]"
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
