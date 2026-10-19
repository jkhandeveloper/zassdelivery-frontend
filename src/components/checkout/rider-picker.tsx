"use client";

import { Bike, Loader2, RefreshCw, Sparkles, UserRound } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Rating } from "@/components/ui/rating";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartRiders, useSetCartRider } from "@/hooks/use-cart";
import { ApiError } from "@/lib/api-client";
import { cn, formatPrice, hasText } from "@/lib/utils";
import type { CartDto, CartRiderOptionDto } from "@/types/cart";

const VEHICLE_LABELS: Record<string, string> = {
  MOTORCYCLE: "Motorcycle",
  BICYCLE: "Bicycle",
  CAR: "Car",
  RICKSHAW: "Rickshaw",
  ON_FOOT: "On foot",
};

function RiderRow({
  rider,
  selected,
  pending,
  onSelect,
}: {
  rider: CartRiderOptionDto;
  selected: boolean;
  pending: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-[var(--radius-input)] border p-3 transition-colors",
        "focus-within:ring-4 focus-within:ring-[var(--brand-ring)]",
        selected
          ? "border-brand bg-brand-soft"
          : "border-border-default bg-surface-muted hover:border-brand",
        pending && "animate-pulse",
      )}
    >
      <input type="radio" name="rider" className="sr-only" checked={selected} onChange={onSelect} />

      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-surface text-secondary">
        {hasText(rider.avatarUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element -- a remote avatar of unknown size
          <img src={rider.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <UserRound aria-hidden className="size-5" />
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-bold text-primary">{rider.fullName}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
          {rider.ratingCount > 0 ? (
            <Rating value={rider.rating} count={rider.ratingCount} size="sm" compact />
          ) : (
            <span>New rider</span>
          )}
          {rider.vehicleType !== null && (
            <span className="inline-flex items-center gap-1">
              <Bike aria-hidden className="size-3.5" />
              {VEHICLE_LABELS[rider.vehicleType] ?? rider.vehicleType}
            </span>
          )}
          <span className="numeric">{rider.distanceToPickupKm.toFixed(1)} km from the business</span>
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end">
        <span className="numeric text-sm font-extrabold text-primary">
          {rider.deliveryFee === null ? "—" : formatPrice(rider.deliveryFee)}
        </span>
        <span className="numeric text-[0.6875rem] text-muted">
          {rider.perKmRate === null ? "Standard rate" : `${formatPrice(rider.perKmRate)}/km`}
        </span>
      </span>
    </label>
  );
}

/**
 * "Choose your rider": every rider free to take the order, cheap or dear.
 *
 * Nothing is filtered out on price — the customer may pick the cheapest, the
 * best-rated or the nearest, as they like. "Any available rider" hands the
 * choice back to dispatch at the platform's own rate.
 */
export function RiderPicker({ cart }: { cart: CartDto }) {
  const riders = useCartRiders(cart.delivery.addressId, true);
  const setRider = useSetCartRider();

  const chosenId = cart.rider?.id ?? null;
  const list = riders.data ?? [];

  const choose = (driverId: string | null) => {
    if (driverId === chosenId) return;

    setRider.mutate(
      { driverId },
      {
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "We couldn't choose that rider."),
      },
    );
  };

  return (
    <div className="flex flex-col gap-2.5 border-t border-border-subtle pt-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-primary">Choose your rider</h3>
        <button
          type="button"
          onClick={() => void riders.refetch()}
          disabled={riders.isFetching}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-brand transition-colors hover:bg-brand-soft disabled:opacity-60"
        >
          {riders.isFetching ? (
            <Loader2 aria-hidden className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw aria-hidden className="size-3.5" />
          )}
          Refresh
        </button>
      </div>
      <p className="text-xs text-muted">
        Each rider sets their own price per kilometre. Pick any rider you like, cheaper or dearer.
        The delivery fee follows your choice.
      </p>

      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-[var(--radius-input)] border p-3 transition-colors",
          "focus-within:ring-4 focus-within:ring-[var(--brand-ring)]",
          chosenId === null
            ? "border-brand bg-brand-soft"
            : "border-border-default bg-surface-muted hover:border-brand",
        )}
      >
        <input
          type="radio"
          name="rider"
          className="sr-only"
          checked={chosenId === null}
          onChange={() => choose(null)}
        />
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-brand">
          <Sparkles aria-hidden className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-bold text-primary">Any available rider</span>
          <span className="text-xs text-muted">The nearest free rider, at the standard rate</span>
        </span>
      </label>

      {riders.isPending ? (
        Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} className="h-16 rounded-[var(--radius-input)]" />
        ))
      ) : riders.isError ? (
        <p className="rounded-[var(--radius-input)] bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
          We couldn&apos;t load the riders nearby. Try refreshing.
        </p>
      ) : list.length === 0 ? (
        <p className="rounded-[var(--radius-input)] bg-surface-muted px-3.5 py-2.5 text-sm text-secondary">
          No rider is online near this business right now. We&apos;ll find you one as soon as the
          order is accepted.
        </p>
      ) : (
        list.map((rider) => (
          <RiderRow
            key={rider.id}
            rider={rider}
            selected={chosenId === rider.id}
            pending={setRider.isPending && setRider.variables?.driverId === rider.id}
            onSelect={() => choose(rider.id)}
          />
        ))
      )}
    </div>
  );
}
