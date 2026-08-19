"use client";

import { Coffee, Power, Radio } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSetAvailability, useUpdateRiderLocation } from "@/hooks/use-riders";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { DriverAvailability } from "@/types/enums";
import type { RiderDto, SelfServiceAvailability } from "@/types/rider";

const STATES: Array<{
  value: SelfServiceAvailability;
  label: string;
  icon: typeof Power;
  active: string;
}> = [
  {
    value: DriverAvailability.ONLINE,
    label: "Online",
    icon: Radio,
    active: "bg-success text-white dark:text-[#04231a]",
  },
  {
    value: DriverAvailability.ON_BREAK,
    label: "On break",
    icon: Coffee,
    active: "bg-warning text-white dark:text-[#2a1f04]",
  },
  {
    value: DriverAvailability.OFFLINE,
    label: "Offline",
    icon: Power,
    active: "bg-surface-inverse text-inverse",
  },
];

/**
 * Going online, on break, or off.
 *
 * ON_DELIVERY is not on this control on purpose: it is what accepting a run
 * does and it clears itself when the run ends, so offering it as a choice would
 * let a rider claim to be carrying an order they are not.
 *
 * Going online sends the rider's position with the request when the browser
 * will give it. Dispatch ranks offers by distance, so a rider who comes online
 * without one is invisible to the first round of offers rather than merely
 * further down it — worth a permission prompt, and worth not blocking on.
 */
export function AvailabilityToggle({ rider }: { rider: RiderDto }) {
  const setAvailability = useSetAvailability();
  const updateLocation = useUpdateRiderLocation();
  const [pending, setPending] = React.useState<SelfServiceAvailability | null>(null);

  const onDelivery = rider.availability === DriverAvailability.ON_DELIVERY;

  const currentPosition = (): Promise<GeolocationPosition | null> =>
    new Promise((resolve) => {
      if (typeof navigator === "undefined" || navigator.geolocation === undefined) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8_000, maximumAge: 30_000 },
      );
    });

  const change = async (availability: SelfServiceAvailability) => {
    setPending(availability);

    try {
      const position =
        availability === DriverAvailability.ONLINE ? await currentPosition() : null;

      await setAvailability.mutateAsync({
        availability,
        ...(position !== null && {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });

      if (availability === DriverAvailability.ONLINE) {
        toast.success(
          position === null
            ? "You're online. Turn on location so nearby runs reach you first."
            : "You're online — offers will start coming through.",
        );
      } else {
        toast.success(availability === DriverAvailability.OFFLINE ? "You're offline" : "On break");
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "We couldn't change your availability.",
      );
    } finally {
      setPending(null);
    }
  };

  // While online, keep dispatch's picture of where the rider is current. The
  // socket carries the same fix to any customer watching their order, so this
  // is the one write the whole live map hangs off.
  React.useEffect(() => {
    if (rider.availability === DriverAvailability.OFFLINE) return;
    if (typeof navigator === "undefined" || navigator.geolocation === undefined) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) =>
        updateLocation.mutate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      // A denied or unavailable fix is not worth a toast every few seconds; the
      // rider already saw the message when they went online.
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 20_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // `updateLocation` is a new object every render; the mutation it wraps is
    // stable, so re-subscribing on it would restart the watch continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rider.availability]);

  if (onDelivery) {
    return (
      <div className="flex items-center gap-2.5 rounded-full border border-accent-warm/40 bg-accent-warm-soft px-4 py-2 text-sm font-bold text-accent-warm">
        <span aria-hidden className="size-2 animate-pulse rounded-full bg-current" />
        On a delivery
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Your availability"
      className="flex items-center gap-1 rounded-full border border-border-default bg-surface-muted p-1"
    >
      {STATES.map((state) => {
        const active = rider.availability === state.value;
        const Icon = state.icon;
        const busy = pending === state.value;
        const blocked = state.value === DriverAvailability.ONLINE && !rider.canGoOnline;

        return (
          <Button
            key={state.value}
            size="sm"
            variant="ghost"
            aria-pressed={active}
            disabled={pending !== null || blocked}
            loading={busy}
            title={
              blocked ? "Your application has to be approved before you can go online" : undefined
            }
            onClick={() => void change(state.value)}
            className={cn(
              "rounded-full hover:-translate-y-0",
              active ? state.active : "text-secondary",
            )}
          >
            {!busy && <Icon aria-hidden className="size-4" />}
            {state.label}
          </Button>
        );
      })}
    </div>
  );
}
