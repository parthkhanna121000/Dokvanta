"use client";

import { Button } from "@/components/ui/button";

/** Root error boundary. Must be a Client Component so `reset` can re-render the segment. */
export default function GlobalSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      role="alert"
      className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center"
    >
      <h1 className="font-serif text-title">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred while loading this page.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>
      )}
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
