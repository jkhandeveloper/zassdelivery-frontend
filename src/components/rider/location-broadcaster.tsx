"use client";

import * as React from "react";

import { useRealtime } from "@/components/providers/realtime-provider";
import { useRiderProfile, useUpdateRiderLocation } from "@/hooks/use-riders";
import { reportRiderLocation } from "@/lib/socket";
import { DriverAvailability, DriverStatus } from "@/types/enums";

/** How often the HTTP fallback is allowed to write, when the socket is down. */
const REST_FALLBACK_INTERVAL_MS = 15_000;

/**
 * The rider's position, on its way to the customer's map.
 *
 * Mounted in the rider layout rather than on one screen, because a rider mid-run
 * is far more likely to be sitting on their delivery screen than on the
 * dashboard — a watcher that only ran on `/rider` stopped reporting the moment
 * they opened the run they were actually doing, which is precisely when the
 * customer is watching.
 *
 * The socket is the primary path: the gateway attributes each fix to the
 * rider's own accepted run, works out the distance left, broadcasts it to
 * whoever is watching that order, and persists at most one in fifteen seconds.
 * When the socket is not connected the same fix goes over HTTP instead — the
 * API broadcasts from there too, so a rider on a connection too poor for a
 * websocket still shows up on the map, just less often. Only one path runs at a
 * time; sending both would double every write for no extra freshness.
 *
 * Nothing is reported while the rider is offline. A rider who has finished for
 * the day is not on shift, and their phone is not the platform's to follow.
 */
export function LocationBroadcaster() {
  const profile = useRiderProfile();
  const { state } = useRealtime();
  const updateLocation = useUpdateRiderLocation();

  const rider = profile.data ?? null;

  const tracking =
    rider !== null &&
    rider.status === DriverStatus.ACTIVE &&
    rider.availability !== DriverAvailability.OFFLINE;

  const connected = state === "connected";

  // The mutation object is new on every render and the ref keeps the watcher
  // from being torn down and re-armed because of it — re-arming would drop the
  // browser's warm fix and start the whole permission dance again.
  const restRef = React.useRef(updateLocation);
  React.useEffect(() => {
    restRef.current = updateLocation;
  });

  const connectedRef = React.useRef(connected);
  React.useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  React.useEffect(() => {
    if (!tracking) return;
    if (typeof navigator === "undefined" || navigator.geolocation === undefined) return;

    let lastRestWriteAt = 0;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (connectedRef.current) {
          reportRiderLocation(latitude, longitude);
          return;
        }

        const now = Date.now();
        if (now - lastRestWriteAt < REST_FALLBACK_INTERVAL_MS) return;

        lastRestWriteAt = now;
        restRef.current.mutate({ latitude, longitude });
      },
      // Silent on purpose. A rider who has denied location already knows —
      // the availability toggle told them when they went online, and a toast
      // every few seconds on a screen they are trying to work is not help.
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking]);

  return null;
}
