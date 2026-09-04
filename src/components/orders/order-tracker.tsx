"use client";

import {
  Bike,
  Check,
  ChefHat,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  Receipt,
  Store,
  WifiOff,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { useOrderTracking } from "@/hooks/use-order-tracking";
import { useCancelOrder, useOrder } from "@/hooks/use-orders";
import { ApiError } from "@/lib/api-client";
import { cn, formatDateTime, formatPrice, formatTime, hasText } from "@/lib/utils";
import { OrderStatus } from "@/types/enums";

/**
 * Leaflet touches `window` at module scope, so the map is loaded on the client
 * only. A skeleton stands in during the load rather than nothing, because the
 * map is the tallest thing on the page and its absence would jump the layout.
 */
const DeliveryMap = dynamic(
  () => import("@/components/orders/delivery-map").then((module) => module.DeliveryMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[22rem] w-full rounded-[var(--radius-card)]" />,
  },
);

/** The journey, as the customer experiences it. */
const STEPS = [
  { status: OrderStatus.PLACED, label: "Order placed", icon: Receipt },
  { status: OrderStatus.CONFIRMED, label: "Accepted", icon: Check },
  { status: OrderStatus.PREPARING, label: "Being prepared", icon: ChefHat },
  { status: OrderStatus.READY_FOR_PICKUP, label: "Ready", icon: Package },
  { status: OrderStatus.PICKED_UP, label: "Collected", icon: PackageCheck },
  { status: OrderStatus.ON_THE_WAY, label: "On the way", icon: Bike },
  { status: OrderStatus.DELIVERED, label: "Delivered", icon: MapPin },
] as const;

const STEP_ORDER: string[] = STEPS.map((step) => step.status);

/** Statuses in which there is still something to watch. */
const LIVE_STATUSES: string[] = [
  OrderStatus.PLACED,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.PICKED_UP,
  OrderStatus.ON_THE_WAY,
];

/**
 * One order, followed live.
 *
 * Two sources feed this screen and each covers what the other cannot. The REST
 * order carries everything that does not move — the items, the totals, the
 * address, the full timeline — and the socket carries the two things that do:
 * the status, and the rider's position. Where they overlap the socket wins,
 * because a snapshot from two seconds ago beats a fetch from thirty.
 */
export function OrderTracker({ orderId }: { orderId: string }) {
  const { isAuthenticated, isReady } = useAuth();
  const signedIn = isReady && isAuthenticated;

  const order = useOrder(orderId, signedIn);
  const tracking = useOrderTracking(signedIn ? orderId : null);
  const cancel = useCancelOrder(orderId);

  if (isReady && !isAuthenticated) {
    return (
      <EmptyState
        icon={<Package className="size-8" />}
        title="Sign in to follow this order"
        description="Tracking is tied to the account the order was placed on."
        action={
          <Button asChild>
            <Link href={`/login?next=${encodeURIComponent(`/orders/${orderId}`)}`}>Sign in</Link>
          </Button>
        }
      />
    );
  }

  if (!isReady || order.isPending) {
    return (
      <SkeletonRegion label="Loading your order" className="flex flex-col gap-5">
        <Skeleton className="h-24 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-[22rem] w-full rounded-[var(--radius-card)]" />
      </SkeletonRegion>
    );
  }

  if (order.isError) {
    return <ErrorState error={order.error} onRetry={() => void order.refetch()} />;
  }

  const data = order.data;

  // The socket's status is the fresher of the two — a transition reaches this
  // screen before any refetch it triggers comes back.
  const status = tracking.status ?? data.status;
  const statusText = tracking.statusText ?? data.statusText;
  const live = LIVE_STATUSES.includes(status);
  const estimatedDeliveryAt = tracking.estimatedDeliveryAt ?? data.estimatedDeliveryAt;

  const rider =
    tracking.rider ??
    (data.driver === null
      ? null
      : { id: data.driver.id, name: data.driver.name, phone: data.driver.phone ?? "" });

  const riderPoint =
    tracking.riderLocation === null
      ? null
      : { latitude: tracking.riderLocation.latitude, longitude: tracking.riderLocation.longitude };

  const currentStep = STEP_ORDER.indexOf(status);

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="numeric text-xs font-bold uppercase tracking-wide text-muted">
            #{data.orderNumber}
          </span>
          <h2 className="font-display text-2xl font-extrabold text-primary">
            {data.restaurant.name}
          </h2>
          <p className="text-sm text-secondary">{statusText}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusPill status={status} label={statusText} withDot />
          {estimatedDeliveryAt !== null && live && (
            <span className="numeric text-sm text-secondary">
              Expected by <strong className="text-primary">{formatTime(estimatedDeliveryAt)}</strong>
            </span>
          )}
          {status === OrderStatus.DELIVERED && data.deliveredAt !== null && (
            <span className="numeric text-sm text-secondary">
              Delivered {formatDateTime(data.deliveredAt)}
            </span>
          )}
        </div>
      </Card>

      <Progress currentStep={currentStep} status={status} />

      {live && (
        <>
          <Card className="flex flex-col gap-0 overflow-hidden p-0">
            <DeliveryMap
              pickup={tracking.pickup}
              destination={tracking.destination}
              rider={riderPoint}
              riderName={rider?.name ?? null}
              className="h-[22rem] w-full rounded-none border-0"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-5 py-3.5">
              <p className="text-sm text-secondary">
                {riderPoint === null
                  ? rider === null
                    ? "We're finding a rider for you. Their position appears here as soon as one takes the order."
                    : `${rider.name} has the order. Their position appears here as soon as their app reports in.`
                  : tracking.riderLocation?.distanceKm == null
                    ? "Your rider is moving."
                    : `About ${tracking.riderLocation.distanceKm.toFixed(1)} km away.`}
              </p>

              <ConnectionNote state={tracking.connection} />
            </div>
          </Card>

          {rider !== null && <RiderCard name={rider.name} phone={rider.phone} />}

          {(status === OrderStatus.PICKED_UP || status === OrderStatus.ON_THE_WAY) && (
            <Card className="flex items-start gap-3 border-brand/30 bg-brand-soft p-5">
              <Bike aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
              <div className="flex flex-col gap-1">
                <p className="font-bold text-primary">Have your four-digit code ready</p>
                <p className="text-sm text-secondary">
                  We sent it to you when the rider collected your order — check your notifications.
                  The rider needs it at the door to close the delivery.
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      <Summary
        deliveryAddress={data.deliveryAddress}
        deliveryLandmark={data.deliveryLandmark}
        restaurantName={data.restaurant.name}
        total={data.totals.totalAmount}
        itemCount={data.items.reduce((count, item) => count + item.quantity, 0)}
      />

      {data.canCancel && live && (
        <div>
          <Button
            variant="danger"
            loading={cancel.isPending}
            onClick={() =>
              cancel.mutate(
                { reason: "Cancelled from order tracking" },
                {
                  onSuccess: () => toast.success("Order cancelled"),
                  onError: (error) =>
                    toast.error(
                      error instanceof ApiError ? error.message : "We couldn't cancel that order.",
                    ),
                },
              )
            }
          >
            Cancel order
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * How far along the order is.
 *
 * Statuses that are not part of the journey get a line of their own rather than
 * a half-drawn strip. That covers both ends: an order still waiting for payment
 * has not started, and a cancelled or rejected one never will — drawing either
 * as a stalled delivery would misrepresent what happened.
 */
function Progress({ currentStep, status }: { currentStep: number; status: string }) {
  if (currentStep === -1) {
    const waiting = status === OrderStatus.PENDING_PAYMENT;

    return (
      <Card
        className={cn(
          "flex items-center gap-3 p-5",
          waiting ? "border-warning/30 bg-warning-soft" : "border-danger/30 bg-danger-soft",
        )}
      >
        <span
          aria-hidden
          className={cn("size-2.5 shrink-0 rounded-full", waiting ? "bg-warning" : "bg-danger")}
        />
        <p className="font-bold text-primary">
          {waiting
            ? "This order is waiting for payment. It reaches the restaurant once that clears."
            : `This order is ${status.toLowerCase().replace(/_/g, " ")} and is no longer on its way.`}
        </p>
      </Card>
    );
  }

  return (
    <ol className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
      {STEPS.map((step, index) => {
        const done = index < currentStep;
        const active = index === currentStep;
        const Icon = step.icon;

        return (
          <li key={step.status} className="flex flex-col items-center gap-2 text-center">
            <span
              className={cn(
                "relative flex size-10 items-center justify-center rounded-full border-2 transition-colors",
                done && "border-success bg-success text-white dark:text-[#04231a]",
                active && "border-brand bg-brand text-[var(--brand-contrast)]",
                !done && !active && "border-border-default text-muted",
              )}
            >
              <Icon aria-hidden className="size-4" />
              {/* Anchored to this badge, not to whichever ancestor happened to
                  be positioned — the ring has to sit on the current step. */}
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-0 animate-ping rounded-full border-2 border-brand opacity-60"
                />
              )}
            </span>
            <span
              className={cn(
                "text-xs font-bold",
                active ? "text-brand" : done ? "text-primary" : "text-muted",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function RiderCard({ name, phone }: { name: string; phone: string }) {
  return (
    <Card className="flex flex-wrap items-center gap-4 p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Bike aria-hidden className="size-5" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Your rider</span>
        <span className="font-display text-lg font-extrabold text-primary">{name}</span>
      </div>

      {hasText(phone) && (
        <Button variant="outline" asChild>
          <a href={`tel:${phone}`}>
            <Phone aria-hidden className="size-4" />
            Call
          </a>
        </Button>
      )}
    </Card>
  );
}

function Summary({
  deliveryAddress,
  deliveryLandmark,
  restaurantName,
  total,
  itemCount,
}: {
  deliveryAddress: string;
  deliveryLandmark: string | null;
  restaurantName: string;
  total: number;
  itemCount: number;
}) {
  return (
    <Card className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
      <div className="flex gap-3">
        <Store aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">From</span>
          <span className="font-semibold text-primary">{restaurantName}</span>
          <span className="numeric text-sm text-secondary">
            {itemCount} {itemCount === 1 ? "item" : "items"} · {formatPrice(total)}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">Delivering to</span>
          <span className="font-semibold text-primary">{deliveryAddress}</span>
          {hasText(deliveryLandmark) && (
            <span className="text-sm text-secondary">{deliveryLandmark}</span>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Whether the map is actually live.
 *
 * A stationary rider and a dropped socket look identical on screen, and the
 * difference matters a great deal to somebody waiting for food — so the state
 * is named rather than left to be inferred from a dot that has stopped moving.
 */
function ConnectionNote({ state }: { state: string }) {
  if (state === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
        <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-current" />
        Live
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted">
      <WifiOff aria-hidden className="size-3.5" />
      {state === "offline" ? "Not connected" : "Reconnecting…"}
    </span>
  );
}
