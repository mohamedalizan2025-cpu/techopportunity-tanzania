export default function Loading() {
  return (
    <main id="main-content" className="flex flex-1 flex-col" aria-busy="true" aria-live="polite">
      <div className="bg-[var(--hero)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-20 sm:px-8 sm:py-28">
        <span className="sr-only">Loading opportunities…</span>
        <div className="h-7 w-60 animate-pulse rounded-full bg-[var(--muted-surface)]" />
        <div className="h-16 w-full max-w-2xl animate-pulse rounded-2xl bg-[var(--muted-surface)] sm:h-24" />
        <div className="h-16 w-full max-w-xl animate-pulse rounded-2xl bg-[var(--muted-surface)]" />
      </div>
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-16 sm:grid-cols-2 sm:px-8">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-[var(--muted-surface)]" />)}
      </div>
    </main>
  );
}
