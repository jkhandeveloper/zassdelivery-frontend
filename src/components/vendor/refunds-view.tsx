"use client";

import { Undo2 } from "lucide-react";
import * as React from "react";

import { ReasonDialog } from "@/components/admin/reason-dialog";
import { PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { VendorGate } from "@/components/vendor/vendor-gate";
import { useRecordRefund, useRestaurantOrders } from "@/hooks/use-vendor";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-labels";
import { cn, formatPrice, formatRelative, hasText } from "@/lib/utils";
import { OrderStatus, PaymentStatus } from "@/types/enums";
import type { OrderDto } from "@/types/order";

/** Payment states where the kitchen actually holds the customer's money. */
const MONEY_TAKEN: PaymentStatus[] = [
  PaymentStatus.PAID,
  PaymentStatus.PARTIALLY_REFUNDED,
  PaymentStatus.REFUNDED,
];

/** The order never reached the customer, so whatever they paid is owed back in full. */
const DID_NOT_GO_AHEAD: OrderStatus[] = [
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
  OrderStatus.FAILED,
];

const refundableOf = (order: OrderDto) =>
  Math.max(0, order.totals.totalAmount - order.refundedAmount);

const owesCustomer = (order: OrderDto) =>
  DID_NOT_GO_AHEAD.includes(order.status) && refundableOf(order) > 0;

export function VendorRefundsView() {
  return (
    <VendorGate>
      {(restaurant) => (
        <div className="flex flex-col gap-6">
          <PortalHeader
            title="Refunds"
            description="Customers pay you directly, so refunds come from you. Send the money back by cash or transfer, then record it here so the customer and the order show it."
          />
          <RefundList restaurantId={restaurant.id} />
        </div>
      )}
    </VendorGate>
  );
}

function RefundList({ restaurantId }: { restaurantId: string }) {
  const orders = useRestaurantOrders(restaurantId, { limit: 50 });
  const record = useRecordRefund();
  const [refunding, setRefunding] = React.useState<OrderDto | null>(null);

  if (orders.isPending) {
    return <ListSkeleton label="Loading paid orders" count={3} />;
  }

  if (orders.isError) {
    return <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />;
  }

  // Orders that did not go ahead first: those customers are owed money now.
  const paid = orders.data.items
    .filter((order) => MONEY_TAKEN.includes(order.paymentStatus))
    .sort((a, b) => Number(owesCustomer(b)) - Number(owesCustomer(a)));

  if (paid.length === 0) {
    return (
      <EmptyState
        icon={<Undo2 className="size-8" />}
        title="No paid orders to refund"
        description="Orders appear here once their payment is confirmed. Cash orders count as paid when the rider collects the money."
      />
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {paid.map((order) => (
          <li key={order.id}>
            <RefundCard order={order} onRefund={() => setRefunding(order)} />
          </li>
        ))}
      </ul>

      <ReasonDialog
        open={refunding !== null}
        onOpenChange={(open) => !open && setRefunding(null)}
        title={`Record a refund for ${refunding?.orderNumber ?? ""}`}
        description="Only record money you have already sent back to the customer. ZassDelivery does not move it for you."
        reasonLabel="Why was it refunded, and how did you send it?"
        placeholder="e.g. Order cancelled — Rs 650 sent back to the customer's JazzCash."
        confirmLabel="Record refund"
        variant="primary"
        pending={record.isPending}
        successMessage="Refund recorded."
        amount={
          refunding === null
            ? undefined
            : {
                label: "Amount returned",
                max: refundableOf(refunding),
                hint: `Up to ${formatPrice(refundableOf(refunding))}. Leave blank if you returned all of it.`,
              }
        }
        onConfirm={({ reason, amount }) =>
          record.mutateAsync({ id: refunding?.id ?? "", data: { reason, amount } })
        }
      />
    </>
  );
}

function RefundCard({ order, onRefund }: { order: OrderDto; onRefund: () => void }) {
  const refundable = refundableOf(order);
  const owed = owesCustomer(order);

  return (
    <Card className={cn("flex h-full flex-col gap-3 p-4", owed && "border-warning/40")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="numeric font-bold text-primary">{order.orderNumber}</span>
          <span className="text-xs text-muted">
            {formatRelative(order.placedAt ?? order.createdAt)}
          </span>
        </div>
        <StatusPill status={order.status} label={order.statusText} size="sm" withDot />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="numeric font-bold text-primary">
          {formatPrice(order.totals.totalAmount)}
        </span>
        <span className="text-xs text-muted">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
      </div>

      {order.refundedAmount > 0 && (
        <p className="numeric text-xs text-secondary">
          {formatPrice(order.refundedAmount)} already returned
        </p>
      )}

      {owed && (
        <p className="rounded-[var(--radius-input)] bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
          This order did not go ahead
          {hasText(order.cancellationReason) ? ` (${order.cancellationReason})` : ""}. The
          customer is owed {formatPrice(refundable)}.
        </p>
      )}

      <div className="mt-auto">
        {refundable > 0 ? (
          <Button size="sm" variant={owed ? "primary" : "outline"} onClick={onRefund}>
            <Undo2 className="size-4" />
            Record refund
          </Button>
        ) : (
          <span className="text-xs font-semibold text-success">Fully refunded</span>
        )}
      </div>
    </Card>
  );
}
