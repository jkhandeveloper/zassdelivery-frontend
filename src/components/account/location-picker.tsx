"use client";

import { Check, Crosshair, Loader2, MapPin, TriangleAlert } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocation, useZones } from "@/hooks/use-geo";
import { cn, formatPrice } from "@/lib/utils";
import { groupByCity, resolveZone, type Coordinates, type ZoneDto } from "@/types/geo";

export interface PickedLocation extends Coordinates {
  /** The zone the point resolved into. */
  zone: ZoneDto;
}

/**
 * Where an address actually is.
 *
 * The API resolves a delivery zone from coordinates and refuses to save an
 * address outside every zone — so a form that cannot produce real coordinates
 * cannot save an address at all. That was the bug this replaces: the previous
 * form posted `0, 0` for every address, which is a point in the Gulf of Guinea,
 * so every save came back "outside our delivery area".
 *
 * Two ways in, because neither alone is enough: the device's own position,
 * which is exact but needs a permission a desktop user often has no way to
 * grant, and the published zone list, which always works but only places the
 * customer to the middle of their neighbourhood. Whichever is used, the point
 * is tested against the same zone geometry the backend uses *before* the save,
 * so the customer learns they are out of area from the picker rather than from
 * a rejected submit.
 */
export function LocationPicker({
  value,
  onChange,
  className,
}: {
  value: PickedLocation | null;
  onChange: (location: PickedLocation | null) => void;
  className?: string;
}) {
  const zones = useZones();
  const geolocation = useGeolocation();
  const { status: geoStatus, locate, reset: resetGeolocation } = geolocation;

  const zoneList = React.useMemo(() => zones.data ?? [], [zones.data]);

  // A device fix has to be resolved against the zones, and both arrive
  // independently — so the match is derived rather than stored, and settles
  // itself whichever lands second.
  const deviceFix = geolocation.status === "ready" ? geolocation.coordinates : null;
  const deviceMatch = React.useMemo(
    () => (deviceFix === null ? null : resolveZone(deviceFix, zoneList)),
    [deviceFix, zoneList],
  );

  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    if (deviceFix === null || zoneList.length === 0) return;

    onChangeRef.current(
      deviceMatch === null ? null : { ...deviceFix, zone: deviceMatch.zone },
    );
  }, [deviceFix, deviceMatch, zoneList.length]);

  const pickZone = (zone: ZoneDto) => {
    // Falling back to the zone centre is honest about its precision: it is the
    // neighbourhood, not the doorstep, which is what the street address and
    // landmark on the form are for.
    resetGeolocation();
    onChange({ latitude: zone.centerLat, longitude: zone.centerLng, zone });
  };

  const outOfArea = deviceFix !== null && deviceMatch === null && zoneList.length > 0;
  const usingDeviceFix = deviceFix !== null && value !== null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-primary">
          Delivery location
          <span aria-hidden className="ml-0.5 text-brand">
            *
          </span>
        </span>
        <p className="text-sm text-muted">
          We price delivery from where you are, so we need the spot — not just the street.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={locate}
        loading={geoStatus === "locating"}
        className="justify-start"
      >
        {geoStatus === "locating" ? (
          <Loader2 aria-hidden className="size-4 animate-spin" />
        ) : (
          <Crosshair aria-hidden className="size-4" />
        )}
        Use my current location
      </Button>

      {geolocation.status === "error" && (
        <Message tone="warning" icon={<TriangleAlert className="size-4" />}>
          {geolocation.message}
        </Message>
      )}

      {outOfArea && (
        <Message tone="danger" icon={<TriangleAlert className="size-4" />}>
          You&apos;re outside our delivery area right now. We deliver in{" "}
          {formatCityList(zoneList)} — pick the area you want the order delivered to.
        </Message>
      )}

      {usingDeviceFix && deviceMatch !== null && (
        <Message tone="success" icon={<Check className="size-4" />}>
          Found you in {deviceMatch.zone.name}, {deviceMatch.zone.city.name}
          {geolocation.status === "ready" && geolocation.accuracyMetres !== null && (
            <> · accurate to about {geolocation.accuracyMetres} m</>
          )}
        </Message>
      )}

      <div className="flex items-center gap-3 pt-1">
        <span aria-hidden className="h-px flex-1 bg-border-subtle" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          or pick your area
        </span>
        <span aria-hidden className="h-px flex-1 bg-border-subtle" />
      </div>

      {zones.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-14 rounded-[var(--radius-input)]" />
          ))}
        </div>
      ) : zones.isError ? (
        <Message tone="danger" icon={<TriangleAlert className="size-4" />}>
          We couldn&apos;t load the delivery areas.{" "}
          <button
            type="button"
            onClick={() => void zones.refetch()}
            className="font-bold underline underline-offset-2"
          >
            Try again
          </button>
        </Message>
      ) : (
        <div className="flex flex-col gap-4">
          {groupByCity(zoneList).map(({ city, zones: cityZones }) => (
            <fieldset key={city.id} className="flex flex-col gap-2">
              <legend className="pb-1.5 text-xs font-extrabold uppercase tracking-widest text-muted">
                {city.name}
              </legend>

              {cityZones.map((zone) => {
                // The device fix wins the selected state while it is in use —
                // it resolved into this zone, but to a real point inside it.
                const selected = !usingDeviceFix && value?.zone.id === zone.id;

                return (
                  <label
                    key={zone.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-[var(--radius-input)] border p-3 transition-colors",
                      "focus-within:ring-4 focus-within:ring-[var(--brand-ring)]",
                      selected
                        ? "border-brand bg-brand-soft"
                        : "border-border-default bg-surface-muted hover:border-brand",
                    )}
                  >
                    <input
                      type="radio"
                      name="delivery-zone"
                      className="sr-only"
                      checked={selected}
                      onChange={() => pickZone(zone)}
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-full border-2",
                        selected ? "border-brand" : "border-border-strong",
                      )}
                    >
                      {selected && <span className="size-2 rounded-full bg-brand" />}
                    </span>
                    <MapPin aria-hidden className="size-4 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-primary">
                      {zone.name}
                    </span>
                    <span className="numeric shrink-0 text-xs text-muted">
                      {formatPrice(zone.deliveryFee)} · {zone.etaMinutes} min
                    </span>
                  </label>
                );
              })}
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
}

/** "Pabbi, Nowshera and Peshawar" — the cities we actually serve, from the API. */
function formatCityList(zones: readonly ZoneDto[]): string {
  const names = [...new Set(zones.map((zone) => zone.city.name))];

  if (names.length <= 1) {
    return names[0] ?? "our service area";
  }

  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function Message({
  tone,
  icon,
  children,
}: {
  tone: "success" | "warning" | "danger";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const tones = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
  } as const;

  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-input)] px-3.5 py-2.5 text-sm font-medium",
        tones[tone],
      )}
    >
      <span aria-hidden className="mt-0.5 shrink-0">
        {icon}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </p>
  );
}
