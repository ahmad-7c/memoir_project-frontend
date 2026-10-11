"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-start gap-4 px-6 py-24 min-h-screen justify-center bg-canvas text-ink font-sans">
      <h1 className="font-serif text-heading text-ink">Something didn&apos;t load</h1>

      <p className="text-body-ui text-ink-secondary">
        {error.message || "This page ran into a problem. Nothing was lost."}
      </p>

      {error.digest && <p className="font-mono text-small text-ink-muted">digest: {error.digest}</p>}

      <Button onClick={reset} className="mt-2">
        Try again
      </Button>
    </main>
  );
}
