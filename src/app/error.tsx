"use client";

import { ErrorState } from "@/components/ui/states";

/**
 * §10's app-level render/routing failure screen.
 *
 * `digest` is the only handle on the server-side stack, so it is shown rather
 * than swallowed — without it a support conversation has nothing to go on.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="flex flex-col items-center gap-3">
        <ErrorState
          title="Something broke on our side"
          description="This page couldn't be rendered. Trying again often clears it."
          onRetry={reset}
        />
        {error.digest !== undefined && (
          <p className="numeric text-xs text-muted">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
