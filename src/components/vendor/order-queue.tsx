"use client";

import { ClipboardList, Clock, Phone, User } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { useRealtimeEvent, useRestaurantRoom } from "@/components/providers/realtime-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/input";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import {
  useAcceptOrder,
  useMarkPreparing,
  useMarkReady,
  useRejectOrder,
  useRestaurantOrders,
} from "@/hooks/use-vendor";
import { ApiError } from "@/lib/api-client";
import { cn, formatPrice, formatRelative, formatTime, hasText } from "@/lib/utils";
import { OrderStatus } from "@/types/enums";
import type { OrderDto } from "@/types/order";

/**
 * The kitchen's live queue.
 *
 * Subscribed to the restaurant's room so a new ticket lands without a refresh,
 * and polled underneath by the hook as a floor: a kitchen that misses an order
 * because a websocket dropped is a worse failure than one request every fifteen
 * seconds.
 *
 * Tickets are grouped by what the kitchen has to *do* with them rather than by
 * status name — new tickets first, then what is cooking, then what is waiting
 * for a rider — because that is the order a cook works in.
 */
export function OrderQueue({ restaurantId }: { restaurantId: string }) {
  useRestaurantRoom(restaurantId);

  const orders = useRestaurantOrders(restaurantId, { activeOnly: true, limit: 50 });
  const { refetch } = orders;

  useRealtimeEvent(
    "restaurant:order",
    React.useCallback(
      (payload) => {
        toast.info(`New order ${payload.orderNumber}`, {
          description: `${payload.itemCount} ${payload.itemCount === 1 ? "item" : "items"} · ${formatPrice(payload.totalAmount)}`,
        });
        void refetch();
      },
      [refetch],
    ),
  );

  useRealtimeEvent(
    "restaurant:order-updated",
    React.useCallback(() => void refetch(), [refetch]),
  );

  if (orders.isPending) {
    return <ListSkeleton label="Loading the order queue" count={3} />;
  }

  if (orders.isError) {
    return <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />;
  }

  const items = orders.data.items;

  const columns = [
    {
      title: "New",
      hint: "Accept or turn these down.",
      orders: items.filter((order) => order.status === OrderStatus.PLACED),
    },
    {
      title: "In the kitchen",
      hint: "Accepted and being cooked.",
      orders: items.filter(
        (order) =>
          order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PREPARING,
      ),
    },
    {
      title: "Waiting for a rider",
      hint: "Cooked and ready to collect.",
      orders: items.filter((order) => order.status === OrderStatus.READY_FOR_PICKUP),
    },
  ];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="size-8" />}
        title="Nothing in the queue"
        description="New orders appear here the moment a customer places one — you don't need to refresh."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
      {columns.map((column) => (
        <section key={column.title} className="flex flex-col gap-3">
          <header className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-extrabold text-primary">{column.title}</h2>
            <span className="numeric rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-bold text-secondary">
              {column.orders.length}
            </span>
          </header>

          {column.orders.length === 0 ? (
            <p className="rounded-[var(--radius-card)] border border-dashed border-border-default px-4 py-8 text-center text-sm text-muted">
              {column.hint}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {column.orders.map((order) => (
                <li key={order.id}>
                  <TicketCard order={order} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function TicketCard({ order }: { order: OrderDto }) {
  const accept = useAcceptOrder();
  const reject = useRejectOrder();
  const preparing = useMarkPreparing();
  const ready = useMarkReady();

  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const working =
    accept.isPending || reject.isPending || preparing.isPending || ready.isPending;

  const fail = (error: unknown, fallback: string) =>
    toast.error(error instanceof ApiError ? error.message : fallback);

  return (
    <Card className="flex flex-col gap-3.5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="numeric font-bold text-primary">{order.orderNumber}</span>
          <span className="text-xs text-muted">
            {formatRelative(order.placedAt ?? order.createdAt)}
          </span>
        </div>
        <StatusPill status={order.status} label={order.statusText} size="sm" withDot />
      </div>

      <ul className="flex flex-col gap-1.5 border-y border-border-subtle py-3">
        {order.items.map((line) => (
          <li key={line.id} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0 flex-1">
              <span className="numeric font-bold text-secondary">{line.quantity}× </span>
              <span className="text-primary">{line.name}</span>
              {hasText(line.variantName) && (
                <span className="text-muted"> ({line.variantName})</span>
              )}
              {line.addOns.length > 0 && (
                <span className="block pl-4 text-xs text-muted">
                  {line.addOns.map((addOn) => `+ ${addOn.name}`).join(", ")}
                </span>
              )}
              {hasText(line.notes) && (
                <span className="block pl-4 text-xs font-medium text-warning">{line.notes}</span>
              )}
            </span>
            <span className="numeric shrink-0 text-secondary">{formatPrice(line.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="numeric font-bold text-primary">
          {formatPrice(order.totals.totalAmount)}
        </span>
        <span className="text-xs text-muted">
          {order.paymentMethod.replace(/_/g, " ").toLowerCase()} · {order.paymentStatus.toLowerCase()}
        </span>
      </div>

      {order.estimatedDeliveryAt !== null && (
        <p className="numeric inline-flex items-center gap-1.5 text-xs text-muted">
          <Clock aria-hidden className="size-3.5" />
          Due {formatTime(order.estimatedDeliveryAt)}
        </p>
      )}

      {order.driver !== null && (
        <p className="inline-flex items-center gap-1.5 text-xs text-secondary">
          <User aria-hidden className="size-3.5 text-muted" />
          {order.driver.name}
          {hasText(order.driver.phone) && (
            <a
              href={`tel:${order.driver.phone}`}
              className="inline-flex items-center gap-1 font-bold text-brand"
            >
              <Phone aria-hidden className="size-3" />
              {order.driver.phone}
            </a>
          )}
        </p>
      )}

      {/* The API returns the transitions this actor may make; the buttons are
          gated on that rather than on a status list mirrored over here. */}
      {rejecting ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (reason.trim().length < 5) return;

            reject.mutate(
              { id: order.id, data: { reason: reason.trim() } },
              {
                onSuccess: () => {
                  toast.success(`Order ${order.orderNumber} turned down`);
                  setRejecting(false);
                  setReason("");
                },
                onError: (error) => fail(error, "We couldn't turn that order down."),
              },
            );
          }}
        >
          <Field label="Why?" htmlFor={`reject-${order.id}`} hint="The customer is told this.">
            <Textarea
              id={`reject-${order.id}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="We've run out of the karahi tonight."
              className="min-h-20"
              maxLength={300}
            />
          </Field>
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              variant="danger"
              loading={reject.isPending}
              disabled={reason.trim().length < 5}
            >
              Turn down
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className={cn("flex flex-wrap gap-2", working && "opacity-70")}>
          {order.allowedTransitions.includes(OrderStatus.CONFIRMED) && (
            <Button
              size="sm"
              variant="success"
              className="flex-1"
              loading={accept.isPending}
              disabled={working}
              onClick={() =>
                accept.mutate(order.id, {
                  onSuccess: () => toast.success(`Order ${order.orderNumber} accepted`),
                  onError: (error) => fail(error, "We couldn't accept that order."),
                })
              }
            >
              Accept
            </Button>
          )}

          {order.allowedTransitions.includes(OrderStatus.PREPARING) && (
            <Button
              size="sm"
              className="flex-1"
              loading={preparing.isPending}
              disabled={working}
              onClick={() =>
                preparing.mutate(order.id, {
                  onSuccess: () => toast.success("Marked as cooking"),
                  onError: (error) => fail(error, "We couldn't update that order."),
                })
              }
            >
              Start cooking
            </Button>
          )}

          {order.allowedTransitions.includes(OrderStatus.READY_FOR_PICKUP) && (
            <Button
              size="sm"
              variant="neon"
              className="flex-1"
              loading={ready.isPending}
              disabled={working}
              onClick={() =>
                ready.mutate(order.id, {
                  onSuccess: () => toast.success("Ready for pickup — dispatch has been told"),
                  onError: (error) => fail(error, "We couldn't update that order."),
                })
              }
            >
              Ready for pickup
            </Button>
          )}

          {order.allowedTransitions.includes(OrderStatus.REJECTED) && (
            <Button size="sm" variant="ghost" disabled={working} onClick={() => setRejecting(true)}>
              Turn down
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
