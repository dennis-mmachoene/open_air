"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced to the console in dev; wire to Sentry once a DSN is set.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-5 py-24 text-center">
      <h1 className="font-display text-3xl text-text">Something went wrong</h1>
      <p className="text-text-soft">
        A hiccup on our side. Try again — if it keeps happening, it&apos;s us, not you.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-text px-5 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
