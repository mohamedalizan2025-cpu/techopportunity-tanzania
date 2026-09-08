export default function Loading() {
  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="border-b border-[var(--line)] bg-[var(--hero)]">
        <div className="page-shell flex flex-col gap-5 py-10">
          <span className="sr-only">Loading opportunities…</span>
          <div
            aria-hidden="true"
            className="h-4 w-52 animate-pulse rounded bg-[var(--line)]"
          />
          <div
            aria-hidden="true"
            className="h-24 w-full max-w-lg animate-pulse rounded-xl bg-[var(--line)]"
          />
          <div
            aria-hidden="true"
            className="h-12 w-full max-w-xl animate-pulse rounded-lg bg-[var(--line)]"
          />
        </div>
      </div>
      <div className="page-shell py-8" aria-hidden="true">
        <div className="h-40 animate-pulse rounded-xl border border-[var(--line)] bg-[var(--surface)]" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-xl border border-[var(--line)] bg-[var(--surface)]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
