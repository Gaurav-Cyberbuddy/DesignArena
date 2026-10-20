"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-2xl border bg-card p-8">
      <h1 className="font-display text-2xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">Try again, or return to the gallery.</p>
      <Button className="mt-4" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
