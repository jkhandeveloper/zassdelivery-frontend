"use client";

import { ChevronDown, MapPin, Package, Receipt } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { OrderCardSkeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { useCancelOrder, useOrders } from "@/hooks/use-orders";
import { ApiError } from "@/lib/api-client";
import { cn, formatPrice } from "@/lib/utils";
import { OrderStatus } from "@/types/enums";
import type { OrderDto } from "@/types/order";

const PAGE_SIZE = 10;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(date);
}

/**
 * One order.
 *
 * "View details" expands in place rather than pushing a route: everything the
 * summary needs — items, totals and the status timeline — is already on the
 * order the list returned, so a second screen would be a second fetch for data
 * we are holding.
 */
function OrderRow({ order }: { order: OrderDto }) {
  const [open, setOpen] = React.useState(false);
  const cancel = useCancelOrder(order.id);

  const live = order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED;

  return (
    <li className="overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface shadow-card transition-colors hover:border-brand/30">
      <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
        <span className="size-12 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
          <Media variant="store" />
        </span>

        <div className="flex min-w-[9rem] flex-1 flex-col gap-0.5">
          <span className="numeric text-xs font-bold uppercase tracking-wide text-muted">
            #{order.orderNumber}
          </span>
          <span className="font-display text-[0.9375rem] font-extrabold text-primary">
            {order.restaurant.name}
          </span>
          <span className="numeric text-xs text-muted">
            {formatDate(order.placedAt ?? order.createdAt)} ·{" "}
            {formatTime(order.placedAt ?? order.createdAt)}
          </span>
        </div>

        <span className="numeric hidden w-28 shrink-0 text-sm font-bold text-primary sm:block">
          {formatPrice(order.totals.totalAmount)}
        </span>

        <StatusPill status={order.status} label={order.statusText} withDot className="shrink-0" />

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border-default px-3.5 py-2 text-sm font-bold text-secondary transition-colors hover:border-brand hover:text-brand"
        >
          {open ? "Hide details" : "View details"}
          <ChevronDown
            aria-hidden
            className={cn("size-4 transition-transform duration-200", open && "rotate-180")}
          />
        </button>
      </div>

      {open && (
        <div className="grid gap-6 border-t border-border-subtle bg-surface-muted/60 p-4 sm:p-5 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-muted">
              Items
            </h3>
            <ul className="flex flex-col gap-2">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="numeric font-bold text-secondary">{item.quantity}× </span>
                    <span className="text-primary">{item.name}</span>
                    {item.variantName !== null && item.variantName !== "" && (
                      <span className="text-muted"> · {item.variantName}</span>
                    )}
                    {item.addOns.length > 0 && (
                      <span className="block text-xs text-muted">
                        {item.addOns.map((addOn) => addOn.name).join(", ")}
                      </span>
                    )}
                  </span>
                  <span className="numeric shrink-0 font-semibold text-primary">
                    {formatPrice(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="flex flex-col gap-1.5 border-t border-border-subtle pt-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-secondary">Subtotal</dt>
                <dd className="numeric font-semibold">{formatPrice(order.totals.subtotal)}</dd>
              </div>
              {order.totals.discountAmount > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-secondary">Discount</dt>
                  <dd className="numeric font-semibold text-success">
                    − {formatPrice(order.totals.discountAmount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-secondary">Delivery</dt>
                <dd className="numeric font-semibold">
                  {order.totals.deliveryFee === 0 ? "Free" : formatPrice(order.totals.deliveryFee)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border-subtle pt-1.5">
                <dt className="font-display font-extrabold">Total</dt>
                <dd className="numeric font-display font-extrabold text-brand">
                  {formatPrice(order.totals.totalAmount)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-muted">
              Progress
            </h3>

            <ol className="flex flex-col gap-3">
              {order.timeline.map((entry, index) => (
                <li key={`${entry.toStatus}-${entry.at}`} className="flex gap-3">
                  <span className="flex flex-col items-center">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1 size-2.5 shrink-0 rounded-full",
                        index === order.timeline.length - 1 ? "bg-brand" : "bg-border-strong",
                      )}
                    />
                    {index < order.timeline.length - 1 && (
                      <span aria-hidden className="w-px flex-1 bg-border-default" />
                    )}
                  </span>
                  <span className="flex flex-col pb-1">
                    <span className="text-sm font-semibold text-primary">{entry.label}</span>
                    <span className="numeric text-xs text-muted">
                      {formatDate(entry.at)} · {formatTime(entry.at)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <p className="flex items-start gap-2 text-sm text-secondary">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
              {order.deliveryAddress}
            </p>

            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              {/* The order carries the restaurant's id, not its slug, and the
                  storefront route is keyed by slug — so this searches for the
                  kitchen by name rather than building a URL that would 404. */}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/restaurants?q=${encodeURIComponent(order.restaurant.name)}`}>
                  <Receipt aria-hidden className="size-4" />
                  Order again
                </Link>
              </Button>

              {order.canCancel && live && (
                <Button
                  variant="danger"
                  size="sm"
                  loading={cancel.isPending}
                  onClick={() =>
                    cancel.mutate(
                      { reason: "Cancelled from my orders" },
                      {
                        onSuccess: () => toast.success("Order cancelled"),
                        onError: (error) =>
                          toast.error(
                            error instanceof ApiError
                              ? error.message
                              : "We couldn't cancel that order.",
                          ),
                      },
                    )
                  }
                >
                  Cancel order
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

export function OrderHistory() {
  const { isAuthenticated, isReady } = useAuth();
  const signedIn = isReady && isAuthenticated;

  const [tab, setTab] = React.useState<"active" | "previous">("active");
  const [page, setPage] = React.useState(1);

  // Live orders come from the API's own `activeOnly` flag rather than a status
  // list assembled here — the lifecycle is the server's to define.
  const query = useOrders(
    tab === "active"
      ? { activeOnly: true, limit: PAGE_SIZE, page }
      : { limit: PAGE_SIZE, page },
    signedIn,
  );

  if (isReady && !isAuthenticated) {
    return (
      <EmptyState
        icon={<Package className="size-8" />}
        title="Sign in to see your orders"
        description="Every order you place is kept on your account, with its live status."
        action={
          <Button asChild>
            <Link href="/login?next=%2Forders">Sign in</Link>
          </Button>
        }
      />
    );
  }

  const orders = query.data?.items ?? [];
  // The active tab asks for live orders only; the previous tab is everything,
  // so finished orders are filtered out of it here rather than duplicating rows.
  const visible =
    tab === "previous"
      ? orders.filter(
          (order) =>
            order.status === OrderStatus.DELIVERED ||
            order.status === OrderStatus.CANCELLED ||
            order.status === OrderStatus.REJECTED ||
            order.status === OrderStatus.FAILED,
        )
      : orders;

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Order history" className="flex gap-1 border-b border-border-subtle">
        {(
          [
            { key: "active", label: "Active orders" },
            { key: "previous", label: "Previous orders" },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => {
              // Page 3 of the active list means nothing in the previous one.
              setTab(item.key);
              setPage(1);
            }}
            className={cn(
              "relative px-4 py-3 text-sm font-bold transition-colors",
              tab === item.key ? "text-brand" : "text-secondary hover:text-primary",
              "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand after:transition-transform after:content-['']",
              tab === item.key ? "after:scale-x-100" : "after:scale-x-0",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!isReady || query.isPending ? (
        <SkeletonRegion label="Loading your orders" className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <OrderCardSkeleton key={index} />
          ))}
        </SkeletonRegion>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Package className="size-8" />}
          title={tab === "active" ? "Nothing on the way" : "No past orders yet"}
          description={
            tab === "active"
              ? "You have no orders in progress right now."
              : "Once an order is delivered or cancelled it moves here."
          }
          action={
            <Button asChild>
              <Link href="/restaurants">Browse restaurants</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {visible.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>

          {(query.data?.meta.totalPages ?? 1) > 1 && (
            <nav className="flex items-center justify-center gap-4 pt-2" aria-label="Pagination">
              <Button
                variant="outline"
                disabled={query.data?.meta.hasPreviousPage !== true}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span className="numeric text-sm text-secondary">
                Page {query.data?.meta.page} of {query.data?.meta.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={query.data?.meta.hasNextPage !== true}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
