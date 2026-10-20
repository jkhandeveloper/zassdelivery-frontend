"use client";

import { Check, Crosshair, Loader2, TriangleAlert } from "lucide-react";
import dynamic from "next/dynamic";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocation, useZones } from "@/hooks/use-geo";
import { cn } from "@/lib/utils";
import { resolveZone, type Coordinates } from "@/types/geo";

const ShopLocationMap = dynamic(
  () => import("@/components/vendor/shop-location-map").then((module) => module.ShopLocationMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 w-full rounded-[var(--radius-input)]" />,
  },
);

/** Pabbi, where the first zones are, before anything better is known. */
const DEFAULT_CENTER: Coordinates = { latitude: 34.0088, longitude: 71.7881 };

/**
 * Where the shop is, to the doorstep.
 *
 * A shop's position prices every delivery from it and is where riders are sent
 * to collect, so a neighbourhood centre is not good enough — the vendor drops a
 * pin on the exact spot, or starts from their phone's position and adjusts.
 * The point is checked against the published zones as it moves, the same way
 * the API checks it, so an out-of-area shop is caught here, not on save.
 */
export function ShopLocationPicker({
  value,
  onChange,
  className,
}: {
  value: Coordinates | null;
  onChange: (point: Coordinates) => void;
  className?: string;
}) {
  const zones = useZones();
  const geolocation = useGeolocation();
  const { locate } = geolocation;

  const zoneList = React.useMemo(() => zones.data ?? [], [zones.data]);
  const match = value === null ? null : resolveZone(value, zoneList);

  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // A device fix becomes the pin, once, when it lands.
  const fix = geolocation.status === "ready" ? geolocation.coordinates : null;
  React.useEffect(() => {
    if (fix !== null) onChangeRef.current(fix);
  }, [fix]);

  const fallbackCenter =
    zoneList.length > 0
      ? { latitude: zoneList[0].centerLat, longitude: zoneList[0].centerLng }
      : DEFAULT_CENTER;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-primary">
          Shop location
          <span aria-hidden className="ml-0.5 text-brand">
            *
          </span>
        </span>
        <p className="text-sm text-muted">
          Tap the map where your shop is, then drag the pin to the exact spot. Riders come here to
          collect, and delivery is priced from it.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={locate}
        loading={geolocation.status === "locating"}
        className="justify-start"
      >
        {geolocation.status === "locating" ? (
          <Loader2 aria-hidden className="size-4 animate-spin" />
        ) : (
          <Crosshair aria-hidden className="size-4" />
        )}
        Use my current location
      </Button>

      {geolocation.status === "error" && (
        <p className="flex items-start gap-2 rounded-[var(--radius-input)] bg-warning-soft px-3.5 py-2.5 text-sm font-medium text-warning">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {geolocation.message} You can tap the map instead.
        </p>
      )}

      <ShopLocationMap value={value} fallbackCenter={fallbackCenter} onChange={onChange} />

      {value === null ? (
        <p className="text-sm text-muted">No location set yet.</p>
      ) : zones.isPending ? null : match === null ? (
        <p className="flex items-start gap-2 rounded-[var(--radius-input)] bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          This spot is outside every area we deliver in. Move the pin to where your shop actually
          is.
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-[var(--radius-input)] bg-success-soft px-3.5 py-2.5 text-sm font-medium text-success">
          <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            In {match.zone.name}, {match.zone.city.name}
            <span className="numeric block text-xs font-normal opacity-80">
              {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
            </span>
          </span>
        </p>
      )}
    </div>
  );
}

/** Whether a point lies inside a delivery zone, for gating the save button. */
export function useIsInServiceArea(point: Coordinates | null): boolean {
  const zones = useZones();
  return point !== null && resolveZone(point, zones.data ?? []) !== null;
}
