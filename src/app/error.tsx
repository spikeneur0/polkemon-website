"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:px-6">
      <AlertTriangle className="h-16 w-16 text-yellow-600" />
      <h1 className="mt-6 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">
        An unexpected error occurred. Please try again or contact us if the
        problem persists.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-md border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
