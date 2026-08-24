"use client";

import { Bike, Radio, Send, Timer, TriangleAlert, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { ReasonDialog } from "@/components/admin/reason-dialog";
import { Panel, PortalHeader, StatGrid, StatTile } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { ListSkeleton, StatTileSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import {
  useAdminAssignments,
  useAdminDashboard,
  useAdminOrders,
  useAdminRiders,
  useAssignOrder,
  useCancelAssignment,
  useExpireAssignments,
  useRealtimePresence,
} from "@/hooks/use-admin";
import { useValueChanged } from "@/hooks/use-value-changed";
import { ApiError } from "@/lib/api-client";
import {
  cn,
  formatCountdown,
  formatPrice,
  formatRelative,
  hasText,
  secondsUntil,
} from "@/lib/utils";
import { AssignmentStatus, DriverAvailability, OrderStatus } from "@/types/enums";
import type { AssignmentDto } from "@/types/rider";
import type { OrderDto } from "@/types/order";

/** Statuses where the food exists and somebody has to carry it. */
const NEEDS_RIDER: readonly OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
];

/**
 * Re-renders once a second, for the offer countdowns.
 *
 * A lapsed offer that still shows "1:12 left" is worse than no timer at all —
 * the dispatcher waits for an answer that can never arrive — so the clock is
 * driven locally rather than by the refetch interval.
 */
function useSecondTick(active: boolean): number {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!active) {
      return;
    }

    const timer = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(timer);
  }, [active]);

  return now;
}

/**
 * The dispatch board.
 *
 * Three sections in the order a dispatcher works: what has nobody at all, what
 * has been offered and is still waiting for an answer, and what is already on
 * the road. Automatic dispatch handles most of it; this screen exists for the
 * cases where it did not, so the first section is the one that matters and it
 * comes first even when it is empty.
 */
export function AdminDispatchView() {
  const dashboard = useAdminDashboard();
  const presence = useRealtimePresence();

  const orders = useAdminOrders({ activeOnly: true, limit: 100 });
  const assignments = useAdminAssignments({ limit: 100 });

  const expire = useExpireAssignments();
  const cancel = useCancelAssignment();

  const [assigning, setAssigning] = React.useState<OrderDto | null>(null);
  const [cancelling, setCancelling] = React.useState<AssignmentDto | null>(null);

  const now = useSecondTick(true);

  const allOrders = orders.data?.items ?? [];
  const allAssignments = assignments.data?.items ?? [];

  // An order needs a rider when nobody has accepted it. A live offer counts as
  // covered — reassigning it would leave two riders heading for one kitchen.
  const offeredOrderIds = new Set(
    allAssignments
      .filter(
        (assignment) =>
          assignment.status === AssignmentStatus.OFFERED ||
          assignment.status === AssignmentStatus.ACCEPTED,
      )
      .map((assignment) => assignment.order.id),
  );

  const unassigned = allOrders.filter(
    (order) =>
      NEEDS_RIDER.includes(order.status) &&
      order.driver === null &&
      !offeredOrderIds.has(order.id),
  );

  const liveOffers = allAssignments.filter(
    (assignment) => assignment.status === AssignmentStatus.OFFERED,
  );
  const onTheRoad = allAssignments.filter(
    (assignment) => assignment.status === AssignmentStatus.ACCEPTED,
  );
  const lapsed = liveOffers.filter((offer) => secondsUntil(offer.expiresAt, now) === 0);

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Dispatch"
        description="Live delivery assignments, and manual dispatch when automatic offers go unanswered."
        action={
          <div className="flex flex-col items-end gap-2">
            <span
              className={cn(
                "numeric text-xs",
                presence.data?.gatewayReady === false ? "text-danger" : "text-muted",
              )}
            >
              {presence.data === undefined
                ? "Checking the gateway…"
                : presence.data.gatewayReady
                  ? `Gateway up · ${presence.data.connections} connected`
                  : "Realtime gateway is down"}
            </span>
            <Button
              variant="outline"
              size="sm"
              loading={expire.isPending}
              disabled={lapsed.length === 0}
              onClick={() =>
                expire
                  .mutateAsync(undefined)
                  .then((result) =>
                    toast.success(`${result.expired} lapsed ${result.expired === 1 ? "offer" : "offers"} cleared.`),
                  )
                  .catch(() => toast.error("Could not clear the lapsed offers."))
              }
            >
              <Timer className="size-4" />
              Clear {lapsed.length > 0 ? lapsed.length : ""} lapsed
            </Button>
          </div>
        }
      />

      {orders.isPending || assignments.isPending ? (
        <StatGrid>
          {Array.from({ length: 4 }, (_, index) => (
            <StatTileSkeleton key={index} />
          ))}
        </StatGrid>
      ) : (
        <StatGrid>
          <StatTile
            label="Needs a rider"
            value={unassigned.length}
            hint="Nobody offered or accepted"
            icon={<TriangleAlert className="size-4" />}
            tone={unassigned.length > 0 ? "warm" : "neutral"}
          />
          <StatTile
            label="Offers out"
            value={liveOffers.length}
            hint={lapsed.length > 0 ? `${lapsed.length} already lapsed` : "Awaiting an answer"}
            icon={<Send className="size-4" />}
            tone="brand"
          />
          <StatTile
            label="On the road"
            value={onTheRoad.length}
            hint="Accepted and in progress"
            icon={<Bike className="size-4" />}
            tone="success"
          />
          <StatTile
            label="Riders online"
            value={dashboard.data?.operations.ridersOnline ?? 0}
            hint={`${dashboard.data?.operations.ridersOnDelivery ?? 0} already carrying an order`}
            icon={<Radio className="size-4" />}
            tone={
              (dashboard.data?.operations.ridersOnline ?? 0) === 0 ? "neutral" : "success"
            }
          />
        </StatGrid>
      )}

      <Panel
        title="Needs a rider"
        description="Cooked or cooking, with nobody assigned. Offer these first."
        bodyClassName="p-0"
      >
        {orders.isPending ? (
          <div className="p-5 sm:p-6">
            <ListSkeleton count={2} label="Loading orders" />
          </div>
        ) : orders.isError ? (
          <ErrorState density="inline" error={orders.error} onRetry={() => void orders.refetch()} />
        ) : unassigned.length === 0 ? (
          <EmptyState
            density="inline"
            icon={<Bike className="size-6" />}
            title="Everything has a rider"
            description="Automatic dispatch is keeping up. Orders only land here when an offer goes unanswered."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {unassigned.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="numeric font-bold text-primary">{order.orderNumber}</span>
                    <StatusPill status={order.status} size="sm" />
                  </div>
                  <span className="truncate text-sm text-secondary">
                    {order.restaurant.name} → {order.deliveryAddress}
                  </span>
                  <span className="text-xs text-muted">
                    Placed {formatRelative(order.placedAt ?? order.createdAt)} ·{" "}
                    {formatPrice(order.totals.totalAmount)}
                    {order.distanceKm !== null && ` · ${order.distanceKm.toFixed(1)} km`}
                  </span>
                </div>

                <Button size="sm" onClick={() => setAssigning(order)}>
                  <Send className="size-4" />
                  Assign
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <Panel
          title="Offers out"
          description="Sent to a rider, still waiting for an answer."
          bodyClassName="p-0"
        >
          {assignments.isPending ? (
            <div className="p-5 sm:p-6">
              <ListSkeleton count={2} label="Loading offers" />
            </div>
          ) : liveOffers.length === 0 ? (
            <EmptyState
              density="inline"
              icon={<Send className="size-6" />}
              title="No offers pending"
              description="Every offer has been answered."
            />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {liveOffers.map((offer) => {
                const remaining = secondsUntil(offer.expiresAt, now);

                return (
                  <li key={offer.id} className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="numeric font-bold text-primary">
                        {offer.order.orderNumber}
                      </span>
                      <span className="truncate text-xs text-muted">
                        {offer.order.restaurantName} · {formatPrice(offer.estimatedEarning)}{" "}
                        {offer.isAuto ? "auto" : "manual"}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "numeric shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
                        remaining === 0
                          ? "bg-danger-soft text-danger"
                          : remaining < 30
                            ? "bg-warning-soft text-warning"
                            : "bg-surface-sunken text-secondary",
                      )}
                    >
                      {remaining === 0 ? "Lapsed" : formatCountdown(remaining)}
                    </span>

                    <Button size="sm" variant="ghost" onClick={() => setCancelling(offer)}>
                      <X className="size-4" />
                      <span className="sr-only">Cancel this offer</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="On the road"
          description="Accepted, and on their way."
          bodyClassName="p-0"
        >
          {assignments.isPending ? (
            <div className="p-5 sm:p-6">
              <ListSkeleton count={2} label="Loading deliveries" />
            </div>
          ) : onTheRoad.length === 0 ? (
            <EmptyState
              density="inline"
              icon={<Bike className="size-6" />}
              title="Nothing in transit"
              description="Accepted deliveries appear here until the customer confirms them."
            />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {onTheRoad.map((assignment) => (
                <li
                  key={assignment.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="numeric font-bold text-primary">
                      {assignment.order.orderNumber}
                    </span>
                    <span className="truncate text-xs text-muted">
                      {assignment.order.restaurantName} →{" "}
                      {assignment.order.deliveryAddress}
                    </span>
                  </div>

                  <StatusPill status={assignment.order.status} size="sm" />

                  {assignment.awaitingDeliveryCode && (
                    <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand">
                      Code sent
                    </span>
                  )}

                  <Button size="sm" variant="ghost" onClick={() => setCancelling(assignment)}>
                    <X className="size-4" />
                    <span className="sr-only">Cancel this assignment</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <AssignModal order={assigning} onClose={() => setAssigning(null)} />

      <ReasonDialog
        open={cancelling !== null}
        onOpenChange={(open) => !open && setCancelling(null)}
        title={`Cancel the assignment on ${cancelling?.order.orderNumber ?? ""}?`}
        description="The rider is told, and the order goes back into the pool for a fresh offer."
        placeholder="e.g. Rider stopped responding after accepting."
        confirmLabel="Cancel assignment"
        pending={cancel.isPending}
        successMessage="Assignment cancelled. The order is back in the pool."
        onConfirm={({ reason }) =>
          cancel.mutateAsync({ id: cancelling?.id ?? "", data: { reason } })
        }
      />
    </div>
  );
}

/**
 * Offering one order to a rider.
 *
 * Automatic is the default and the recommended path — it picks by proximity and
 * availability, which a person reading a list cannot do — with a named rider as
 * the override for when a dispatcher knows something the algorithm does not.
 */
function AssignModal({ order, onClose }: { order: OrderDto | null; onClose: () => void }) {
  const assign = useAssignOrder();

  // Only riders who could actually take it: an offer to an offline rider is an
  // offer that will expire.
  const available = useAdminRiders(
    { availability: DriverAvailability.ONLINE, limit: 50 },
    order !== null,
  );

  const [driverId, setDriverId] = React.useState("");
  const [timeout, setTimeoutSeconds] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  if (useValueChanged(order) && order !== null) {
    setDriverId("");
    setTimeoutSeconds("");
    setError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const seconds = timeout.trim() === "" ? undefined : Number(timeout);

    try {
      await assign.mutateAsync({
        orderId: order?.id ?? "",
        data: {
          driverId: driverId === "" ? undefined : driverId,
          timeoutSeconds: seconds,
        },
      });
      toast.success(
        driverId === "" ? "Offered to the nearest available rider." : "Offered to that rider.",
      );
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That did not go through.");
    }
  }

  const riders = available.data?.items ?? [];

  return (
    <Modal open={order !== null} onOpenChange={(open) => !open && onClose()}>
      <ModalContent size="sm">
        <form onSubmit={submit}>
          <ModalHeader>
            <ModalTitle>Assign {order?.orderNumber ?? ""}</ModalTitle>
            <ModalDescription>
              {order === null
                ? null
                : `${order.restaurant.name} → ${order.deliveryAddress}`}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="flex flex-col gap-4">
            <Field
              label="Rider"
              htmlFor="assign-rider"
              hint={
                riders.length === 0
                  ? "Nobody is online right now. An automatic offer will go out as soon as somebody is."
                  : "Leave on automatic unless you have a reason to pick somebody."
              }
            >
              <NativeSelect
                id="assign-rider"
                value={driverId}
                onChange={(event) => setDriverId(event.target.value)}
              >
                <option value="">Nearest available rider (automatic)</option>
                {riders.map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {rider.fullName}
                    {hasText(rider.zoneName) ? ` — ${rider.zoneName}` : ""}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              label="Seconds to answer"
              htmlFor="assign-timeout"
              hint="Leave blank for the platform default."
              error={error ?? undefined}
            >
              <Input
                id="assign-timeout"
                type="number"
                inputMode="numeric"
                min={15}
                max={600}
                value={timeout}
                onChange={(event) => setTimeoutSeconds(event.target.value)}
                placeholder="60"
              />
            </Field>

            {order !== null && (
              <Card className="bg-surface-muted p-4 shadow-none">
                <dl className="flex flex-col gap-1.5 text-sm">
                  <Row label="Order total" value={formatPrice(order.totals.totalAmount)} />
                  <Row
                    label="Payment"
                    value={`${order.paymentMethod === "CASH_ON_DELIVERY" ? "Cash on delivery" : "Prepaid"} · ${order.paymentStatus}`}
                  />
                  {order.distanceKm !== null && (
                    <Row label="Distance" value={`${order.distanceKm.toFixed(1)} km`} />
                  )}
                </dl>
              </Card>
            )}
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={assign.isPending}>
              Send the offer
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-secondary">{label}</dt>
      <dd className="numeric font-semibold text-primary">{value}</dd>
    </div>
  );
}
