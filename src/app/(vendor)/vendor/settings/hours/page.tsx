"use client";

import * as React from "react";
import { toast } from "sonner";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { VendorGate } from "@/components/vendor/vendor-gate";
import { useRestaurantHours } from "@/hooks/use-restaurants";
import { useSetHours } from "@/hooks/use-vendor";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { DayOfWeek } from "@/types/enums";
import type { BusinessHourDto } from "@/types/restaurant";

const DAYS: Array<{ value: DayOfWeek; label: string }> = [
  { value: DayOfWeek.MONDAY, label: "Monday" },
  { value: DayOfWeek.TUESDAY, label: "Tuesday" },
  { value: DayOfWeek.WEDNESDAY, label: "Wednesday" },
  { value: DayOfWeek.THURSDAY, label: "Thursday" },
  { value: DayOfWeek.FRIDAY, label: "Friday" },
  { value: DayOfWeek.SATURDAY, label: "Saturday" },
  { value: DayOfWeek.SUNDAY, label: "Sunday" },
];

export default function VendorHoursPage() {
  return (
    <VendorGate allowUnapproved>{(restaurant) => <Hours restaurantId={restaurant.id} />}</VendorGate>
  );
}

function Hours({ restaurantId }: { restaurantId: string }) {
  const hours = useRestaurantHours(restaurantId);
  const save = useSetHours(restaurantId);

  // Only the vendor's unsaved edits are state. The week as saved is derived
  // from the query, and the editor shows edits layered over it — so there is no
  // effect copying fetched data into state, and a refetch is not fighting a
  // stale copy of the form.
  const [edits, setEdits] = React.useState<Record<string, BusinessHourDto> | null>(null);

  // Every day gets a row whether or not the API returned one, so a day that has
  // never been set is a closed row to fill in rather than a gap in the list.
  const saved = React.useMemo(() => {
    if (hours.data === undefined) return null;

    const byDay = new Map(hours.data.hours.map((entry) => [entry.dayOfWeek, entry]));

    return Object.fromEntries(
      DAYS.map(({ value }) => {
        const entry = byDay.get(value);

        return [
          value,
          {
            dayOfWeek: value,
            opensAt: entry?.opensAt ?? "11:00",
            closesAt: entry?.closesAt ?? "23:00",
            isClosed: entry?.isClosed ?? entry === undefined,
          },
        ];
      }),
    ) as Record<string, BusinessHourDto>;
  }, [hours.data]);

  const draft = edits ?? saved;

  if (hours.isPending || draft === null) {
    return (
      <SkeletonRegion label="Loading opening hours" className="flex flex-col gap-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-96 rounded-[var(--radius-panel)]" />
      </SkeletonRegion>
    );
  }

  if (hours.isError) {
    return <ErrorState error={hours.error} onRetry={() => void hours.refetch()} />;
  }

  const update = (day: DayOfWeek, patch: Partial<BusinessHourDto>) =>
    setEdits((current) => {
      const base = current ?? draft;

      return { ...base, [day]: { ...base[day], ...patch } };
    });

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Opening hours"
        description="When customers can order. Outside these, your storefront shows as closed."
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();

          save.mutate(
            { hours: DAYS.map(({ value }) => draft[value]) },
            {
              onSuccess: () => {
                toast.success("Opening hours saved");
                // Hand the form back to the refetched week, so what is on
                // screen is what the API stored rather than what was typed.
                setEdits(null);
              },
              onError: (error) =>
                toast.error(
                  error instanceof ApiError ? error.message : "We couldn't save those hours.",
                ),
            },
          );
        }}
        className="flex flex-col gap-6"
      >
        <Panel bodyClassName="p-0">
          <ul className="divide-y divide-border-subtle">
            {DAYS.map(({ value, label }) => {
              const entry = draft[value];
              const closed = entry.isClosed === true;

              return (
                <li
                  key={value}
                  className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6"
                >
                  <span className="w-28 shrink-0 font-bold text-primary">{label}</span>

                  <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!closed}
                      onChange={(changed) => update(value, { isClosed: !changed.target.checked })}
                      className="size-4 accent-[var(--brand)]"
                    />
                    <span className={cn(closed ? "text-muted" : "font-semibold text-primary")}>
                      {closed ? "Closed" : "Open"}
                    </span>
                  </label>

                  <div
                    className={cn(
                      "flex flex-wrap items-center gap-2",
                      closed && "pointer-events-none opacity-40",
                    )}
                  >
                    <label htmlFor={`opens-${value}`} className="sr-only">
                      {label} opening time
                    </label>
                    <Input
                      id={`opens-${value}`}
                      type="time"
                      value={entry.opensAt}
                      onChange={(changed) => update(value, { opensAt: changed.target.value })}
                      disabled={closed}
                      className="numeric h-10 w-32"
                    />
                    <span aria-hidden className="text-muted">
                      to
                    </span>
                    <label htmlFor={`closes-${value}`} className="sr-only">
                      {label} closing time
                    </label>
                    <Input
                      id={`closes-${value}`}
                      type="time"
                      value={entry.closesAt}
                      onChange={(changed) => update(value, { closesAt: changed.target.value })}
                      disabled={closed}
                      className="numeric h-10 w-32"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={save.isPending}>
            Save hours
          </Button>
          <p className="text-xs text-muted">
            A closing time earlier than the opening time is treated as running past midnight.
          </p>
        </div>
      </form>
    </div>
  );
}
