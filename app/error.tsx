"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-24 text-center font-sans dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        An unexpected error occurred while loading this page. Your data is
        safe — please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Try again
      </button>
    </div>
  );
}
