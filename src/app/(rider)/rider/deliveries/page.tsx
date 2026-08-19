"use client";

import { Bike } from "lucide-react";
import * as React from "react";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { useRealtimeEvent } from "@/components/providers/realtime-provider";
import { DeliveryPanel } from "@/components/rider/delivery-panel";
import { RiderGate } from "@/components/rider/rider-gate";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { useRiderDeliveries } from "@/hooks/use-riders";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { AssignmentStatus } from "@/types/enums";

export default function RiderDeliveriesPage() {
  return <RiderGate>{() => <Deliveries />}</RiderGate>;
}

function Deliveries() {
  const active = useRiderDeliveries({ status: AssignmentStatus.ACCEPTED, limit: 10 });
  const history = useRiderDeliveries({
    status: AssignmentStatus.COMPLETED,
    limit: 25,
    sortBy: "completedAt",
    sortOrder: "desc",
  });

  const { refetch: refetchActive } = active;

  // A run advances when the restaurant marks it ready or the customer's code is
  // accepted — both reach this screen as an order:status event.
  useRealtimeEvent(
    "order:status",
    React.useCallback(() => void refetchActive(), [refetchActive]),
  );

  const carrying = active.data?.items ?? [];
  const done = history.data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Deliveries"
        description="What you're carrying now, and everything you've completed."
      />

      {active.isPending ? (
        <ListSkeleton label="Loading your active run" count={1} />
      ) : active.isError ? (
        <ErrorState error={active.error} onRetry={() => void active.refetch()} />
      ) : carrying.length === 0 ? (
        <EmptyState
          icon={<Bike className="size-8" />}
          title="Nothing in hand"
          description="Accept a run from your offers and it'll appear here with the addresses and the delivery code step."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {carrying.map((assignment) => (
            <DeliveryPanel key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}

      <Panel title="Completed" description="Your delivery history." bodyClassName="p-0">
        {history.isPending ? (
          <div className="p-5 sm:p-6">
            <ListSkeleton label="Loading delivery history" count={3} />
          </div>
        ) : history.isError ? (
          <ErrorState
            density="inline"
            error={history.error}
            onRetry={() => void history.refetch()}
          />
        ) : done.length === 0 ? (
          <EmptyState
            density="inline"
            icon={<Bike className="size-6" />}
            title="No completed runs yet"
            description="Your finished deliveries will be listed here."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {done.map((assignment) => (
              <li
                key={assignment.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-semibold text-primary">
                    {assignment.order.restaurantName}
                  </span>
                  <span className="numeric text-xs text-muted">
                    {assignment.order.orderNumber} · {formatDateTime(assignment.completedAt)}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="numeric font-bold text-success">
                    {formatPrice(assignment.estimatedEarning)}
                  </span>
                  <StatusPill status={assignment.status} size="sm" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
