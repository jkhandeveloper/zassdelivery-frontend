"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { useRealtimeEvent } from "@/components/providers/realtime-provider";
import { riderKeys } from "@/hooks/use-riders";

/**
 * Keeps the rider's screens current with what happens to them from elsewhere.
 *
 * Mounted in the rider layout rather than on one screen, for the same reason as
 * `LocationBroadcaster`: whichever screen is open, the next one the rider opens
 * should already be right.
 *
 * `delivery:updated` is the API saying the run this rider holds moved on or
 * ended — the kitchen marked it ready, the business or support closed it, or
 * the rider confirmed it from their phone while this tab sat open. The screens
 * used to listen for `order:status` instead, which is sent to the order's room;
 * a rider's dashboard is never in that room, so it never heard a thing and sat
 * on "On a delivery" and yesterday's earnings until it was reloaded.
 *
 * Everything under `riderKeys.all` is invalidated rather than one query patched,
 * because a run ending changes the active run, the history, the rider's
 * availability, the earnings and what they owe the business all at once.
 */
export function RiderLiveSync() {
  const queryClient = useQueryClient();

  useRealtimeEvent(
    "delivery:updated",
    React.useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: riderKeys.all });
    }, [queryClient]),
  );

  useRealtimeEvent(
    "delivery:offered",
    React.useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: [...riderKeys.all, "offers"] });
    }, [queryClient]),
  );

  return null;
}
