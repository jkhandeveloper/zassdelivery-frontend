"use client";

import { Banknote, ClipboardList, Star, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Panel, PortalHeader, StatGrid, StatTile } from "@/components/layout/portal-page";
import { useRealtimeEvent, useRestaurantRoom } from "@/components/providers/realtime-provider";
import { Button } from "@/components/ui/button";
import { StatTileSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { AcceptingOrdersToggle } from "@/components/vendor/accepting-toggle";
import { VendorGate } from "@/components/vendor/vendor-gate";
import { useRestaurantOrders } from "@/hooks/use-vendor";
import { formatPrice, formatRelative } from "@/lib/utils";
import { OrderStatus } from "@/types/enums";
import type { RestaurantAdminDto } from "@/types/restaurant";

export default function VendorDashboardPage() {
  return (
    <VendorGate allowUnapproved>
      {(restaurant) => <Dashboard restaurant={restaurant} />}
    </VendorGate>
  );
}

function Dashboard({ restaurant }: { restaurant: RestaurantAdminDto }) {
  useRestaurantRoom(restaurant.id);

  const live = useRestaurantOrders(restaurant.id, { activeOnly: true, limit: 50 });
  const today = useRestaurantOrders(restaurant.id, {
    from: startOfToday(),
    limit: 100,
  });

  const { refetch: refetchLive } = live;
  const { refetch: refetchToday } = today;

  useRealtimeEvent(
    "restaurant:order",
    React.useCallback(() => {
      void refetchLive();
      void refetchToday();
    }, [refetchLive, refetchToday]),
  );

  const active = live.data?.items ?? [];
  const newTickets = active.filter((order) => order.status === OrderStatus.PLACED);
  const cooking = active.filter(
    (order) => order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PREPARING,
  );

  // Takings are counted from delivered orders only: a placed order is not money
  // yet, and counting it would make the figure fall when one gets cancelled.
  const delivered = (today.data?.items ?? []).filter(
    (order) => order.status === OrderStatus.DELIVERED,
  );
  const takings = delivered.reduce((sum, order) => sum + order.totals.totalAmount, 0);

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title={restaurant.name}
        description={`${restaurant.zone.name}, ${restaurant.city.name}`}
        action={
          <div className="flex flex-col items-end gap-2">
            <StatusPill status={restaurant.status} />
            <AcceptingOrdersToggle restaurant={restaurant} />
          </div>
        }
      />

      {live.isPending || today.isPending ? (
        <StatGrid>
          {Array.from({ length: 4 }, (_, index) => (
            <StatTileSkeleton key={index} />
          ))}
        </StatGrid>
      ) : live.isError ? (
        <ErrorState error={live.error} onRetry={() => void live.refetch()} />
      ) : (
        <StatGrid>
          <StatTile
            label="Waiting on you"
            value={newTickets.length}
            hint="New tickets to accept or turn down"
            icon={<ClipboardList className="size-4" />}
            tone={newTickets.length > 0 ? "warm" : "neutral"}
          />
          <StatTile
            label="In the kitchen"
            value={cooking.length}
            hint="Accepted and cooking"
            icon={<UtensilsCrossed className="size-4" />}
            tone="brand"
          />
          <StatTile
            label="Delivered today"
            value={delivered.length}
            hint={`${active.length} still open`}
            icon={<ClipboardList className="size-4" />}
            tone="success"
          />
          <StatTile
            label="Takings today"
            value={formatPrice(takings)}
            hint="From delivered orders"
            icon={<Banknote className="size-4" />}
            tone="success"
          />
        </StatGrid>
      )}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel
          title="Needs attention"
          description="Tickets nobody has accepted yet."
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vendor/orders">Open the queue</Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {newTickets.length === 0 ? (
            <EmptyState
              density="inline"
              icon={<ClipboardList className="size-6" />}
              title="All caught up"
              description="New orders land here the moment a customer places one."
            />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {newTickets.slice(0, 6).map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="numeric font-bold text-primary">{order.orderNumber}</span>
                    <span className="text-xs text-muted">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"} ·{" "}
                      {formatRelative(order.placedAt ?? order.createdAt)}
                    </span>
                  </div>
                  <span className="numeric shrink-0 font-bold text-primary">
                    {formatPrice(order.totals.totalAmount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Your listing">
          <dl className="flex flex-col gap-4">
            <Row label="Rating">
              <span className="numeric inline-flex items-center gap-1.5 font-bold text-primary">
                <Star aria-hidden className="size-4 text-accent-gold" />
                {restaurant.rating.toFixed(1)}
                <span className="font-normal text-muted">({restaurant.ratingCount})</span>
              </span>
            </Row>
            <Row label="Minimum order">
              <span className="numeric font-semibold text-primary">
                {formatPrice(restaurant.minOrderAmount)}
              </span>
            </Row>
            <Row label="Prep time">
              <span className="numeric font-semibold text-primary">
                {restaurant.avgPreparationMinutes} min
              </span>
            </Row>
            <Row label="Delivery radius">
              <span className="numeric font-semibold text-primary">
                {(restaurant.deliveryRadiusMeters / 1000).toFixed(1)} km
              </span>
            </Row>
            <Row label="Commission">
              <span className="numeric font-semibold text-primary">
                {restaurant.commissionRate}%
              </span>
            </Row>
          </dl>

          <Button asChild variant="outline" block className="mt-5">
            <Link href="/vendor/settings/profile">Edit details</Link>
          </Button>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-sm text-secondary">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/** Midnight local time, as an ISO instant the API's `from` filter accepts. */
function startOfToday(): string {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}
