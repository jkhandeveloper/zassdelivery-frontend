"use client";

import { Loader2, WifiOff } from "lucide-react";

import { useRealtime } from "@/components/providers/realtime-provider";
import { cn } from "@/lib/utils";

/**
 * §9's persistent connection indicator.
 *
 * Deliberately silent while healthy — a green "connected" badge on every screen
 * is noise. It only appears when live updates are *not* arriving, which is the
 * only time the user needs to know.
 */
export function ConnectionIndicator({ className }: { className?: string }) {
  const { state } = useRealtime();

  if (state === "connected" || state === "idle" || state === "connecting") {
    return null;
  }

  const reconnecting = state === "reconnecting";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
        reconnecting ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger",
        className,
      )}
    >
      {reconnecting ? (
        <Loader2 aria-hidden className="size-3.5 animate-spin" />
      ) : (
        <WifiOff aria-hidden className="size-3.5" />
      )}
      {reconnecting ? "Reconnecting…" : "Live updates offline"}
    </div>
  );
}
