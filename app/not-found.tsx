import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-24 text-center font-sans dark:bg-black">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
        404
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
        Page not found
      </h1>
      <p className="max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">
        The page you are looking for does not exist or is no longer publicly
        available.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Browse opportunities
        </Link>
        <Link
          href="/submit"
          className="inline-flex h-11 items-center justify-center rounded-full border border-black/[.10] bg-white px-6 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Submit an opportunity
        </Link>
      </div>
    </div>
  );
}
