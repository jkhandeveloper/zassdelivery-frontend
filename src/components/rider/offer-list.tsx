"use client";

import { Bike, Clock, Inbox, MapPin, Store, Wallet } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { useRealtimeEvent } from "@/components/providers/realtime-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Badge } from "@/components/ui/status-pill";
import { useAcceptOffer, useRejectOffer, useRiderOffers } from "@/hooks/use-riders";
import { ApiError } from "@/lib/api-client";
import { cn, formatCountdown, formatPrice, hasText, secondsUntil } from "@/lib/utils";
import { DriverAvailability } from "@/types/enums";
import type { AssignmentDto, RiderDto } from "@/types/rider";

/**
 * The offers inbox.
 *
 * Two things keep it live: `delivery:offered` on the socket, which makes a new
 * run appear the moment dispatch sends it, and a poll in the hook underneath as
 * a floor. Both are needed — the socket is what makes it feel instant, the poll
 * is what stops a dropped connection leaving a rider staring at an empty inbox
 * while runs go to somebody else.
 */
export function OfferList({ rider }: { rider: RiderDto }) {
  const offers = useRiderOffers({ liveOnly: true, limit: 20 });
  const { refetch } = offers;

  useRealtimeEvent(
    "delivery:offered",
    React.useCallback(
      (payload) => {
        toast.info(`New run from ${payload.restaurantName}`, {
          description: `${formatPrice(payload.estimatedEarning)} · order ${payload.orderNumber}`,
        });
        void refetch();
      },
      [refetch],
    ),
  );

  if (offers.isPending) {
    return <ListSkeleton label="Loading offers" count={2} />;
  }

  if (offers.isError) {
    return <ErrorState error={offers.error} onRetry={() => void offers.refetch()} />;
  }

  // `isLive` is the server's own read on whether an offer is still answerable;
  // an expired row can still be in the page we were handed.
  const live = offers.data.items.filter((offer) => offer.isLive);

  if (live.length === 0) {
    const offline = rider.availability === DriverAvailability.OFFLINE;

    return (
      <EmptyState
        icon={<Inbox className="size-8" />}
        title={offline ? "You're offline" : "No runs right now"}
        description={
          offline
            ? "Go online and dispatch will start sending you deliveries nearby."
            : "Nothing has come in yet. New runs appear here the moment dispatch offers them — you don't need to refresh."
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {live.map((offer) => (
        <li key={offer.id}>
          <OfferCard offer={offer} />
        </li>
      ))}
    </ul>
  );
}

export function OfferCard({ offer }: { offer: AssignmentDto }) {
  const accept = useAcceptOffer();
  const reject = useRejectOffer();
  const remaining = useCountdown(offer.expiresAt);

  const expired = remaining === 0;
  const working = accept.isPending || reject.isPending;
  // Under thirty seconds the timer stops being information and starts being
  // pressure — which is the point, so it gets the danger tone.
  const urgent = remaining <= 30;

  return (
    <Card className={cn("flex flex-col gap-4 p-5", expired && "opacity-60")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-lg font-extrabold text-primary">
              {offer.order.restaurantName}
            </h3>
            {!offer.isAuto && <Badge variant="outline" size="sm">Assigned to you</Badge>}
          </div>
          <p className="numeric text-xs text-muted">Order {offer.order.orderNumber}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="numeric font-display text-2xl font-extrabold text-success">
            {formatPrice(offer.estimatedEarning)}
          </span>
          <span
            className={cn(
              "numeric inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold",
              urgent ? "bg-danger-soft text-danger" : "bg-surface-sunken text-secondary",
            )}
          >
            <Clock aria-hidden className="size-3.5" />
            {expired ? "Expired" : formatCountdown(remaining)}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-3 border-y border-border-subtle py-4 sm:grid-cols-2">
        <Leg
          icon={<Store className="size-4" />}
          label="Pick up"
          value={offer.order.restaurantAddress}
          detail={
            offer.pickupDistanceKm === null
              ? undefined
              : `${offer.pickupDistanceKm.toFixed(1)} km from you`
          }
        />
        <Leg
          icon={<MapPin className="size-4" />}
          label="Drop off"
          value={offer.order.deliveryAddress}
          detail={
            hasText(offer.order.deliveryLandmark) ? offer.order.deliveryLandmark : undefined
          }
        />
      </dl>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {offer.order.distanceKm !== null && (
          <span className="numeric inline-flex items-center gap-1.5 text-secondary">
            <Bike aria-hidden className="size-4 text-muted" />
            {offer.order.distanceKm.toFixed(1)} km run
          </span>
        )}
        {offer.order.cashToCollect > 0 && (
          <span className="numeric inline-flex items-center gap-1.5 font-semibold text-accent-warm">
            <Wallet aria-hidden className="size-4" />
            Collect {formatPrice(offer.order.cashToCollect)} in cash
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="success"
          className="flex-1"
          disabled={expired || working}
          loading={accept.isPending}
          onClick={() =>
            accept.mutate(offer.id, {
              onSuccess: () => toast.success("Run accepted — head to the restaurant"),
              onError: (error) =>
                toast.error(
                  error instanceof ApiError ? error.message : "We couldn't accept that run.",
                ),
            })
          }
        >
          Accept
        </Button>
        <Button
          variant="outline"
          disabled={expired || working}
          loading={reject.isPending}
          onClick={() =>
            reject.mutate(
              { id: offer.id, data: {} },
              {
                onSuccess: () => toast.success("Passed on — it'll go to another rider"),
                onError: (error) =>
                  toast.error(
                    error instanceof ApiError ? error.message : "We couldn't decline that run.",
                  ),
              },
            )
          }
        >
          Decline
        </Button>
      </div>
    </Card>
  );
}

function Leg({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex gap-3">
      <span aria-hidden className="mt-0.5 shrink-0 text-muted">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
        <dd className="text-sm font-semibold text-primary">{value}</dd>
        {detail !== undefined && <dd className="text-xs text-muted">{detail}</dd>}
      </div>
    </div>
  );
}

/**
 * Seconds left on an offer, ticking.
 *
 * The clock is the state and the remaining time is derived from it, rather than
 * a counter being decremented: a tab that was backgrounded — where timers are
 * throttled — comes back showing the real remaining time instead of however many
 * ticks it managed to fire, and a new `expiresAt` is reflected on the next
 * render without an effect having to reset anything.
 */
function useCountdown(expiresAt: string): number {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const deadline = new Date(expiresAt).getTime();
    if (Number.isNaN(deadline) || deadline <= Date.now()) return;

    const timer = setInterval(() => {
      setNow(Date.now());
      // Nothing left to count; stop rather than tick against a dead offer.
      if (Date.now() >= deadline) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return secondsUntil(expiresAt, now);
}
