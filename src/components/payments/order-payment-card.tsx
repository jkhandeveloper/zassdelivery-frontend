"use client";

import { useQueryClient } from "@tanstack/react-query";
import { QrCode } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { PaymentQrList } from "@/components/payments/payment-qr-list";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { orderKeys } from "@/hooks/use-orders";
import { useOrderPaymentQr } from "@/hooks/use-payments";
import { formatPrice } from "@/lib/utils";
import { PaymentMethod, PaymentStatus } from "@/types/enums";

/**
 * How the customer pays a scan-to-pay order — or pays their rider by QR
 * instead of cash.
 *
 * The hook polls while the payment is pending, and when it flips to paid the
 * order is refetched so the rest of the tracker agrees; this card then steps
 * aside, because there is nothing left to scan.
 */
export function OrderPaymentCard({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const qr = useOrderPaymentQr(orderId);
  const announced = React.useRef(false);
  const status = qr.data?.paymentStatus;

  React.useEffect(() => {
    if (status !== PaymentStatus.PAID || announced.current) return;

    announced.current = true;
    toast.success("Payment received — thank you!");
    void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
  }, [status, orderId, queryClient]);

  if (qr.isPending) {
    return <Skeleton className="h-64 w-full rounded-[var(--radius-card)]" />;
  }

  // A failed read should not take the rest of the tracker down with it.
  if (qr.isError || qr.data.paymentStatus !== PaymentStatus.PENDING) {
    return null;
  }

  const data = qr.data;
  const scanToPay = data.paymentMethod === PaymentMethod.QR_TRANSFER;
  const restaurantCodes = scanToPay ? data.restaurant.codes : [];
  const rider = data.rider !== null && data.rider.codes.length > 0 ? data.rider : null;

  if (restaurantCodes.length === 0 && rider === null) {
    return null;
  }

  return (
    <Card className="flex flex-col gap-5 border-brand/30 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-primary">
            <QrCode aria-hidden className="size-5 text-brand" />
            {scanToPay ? `Scan to pay ${formatPrice(data.amount)}` : "Pay by QR instead of cash"}
          </h3>
          <p className="max-w-2xl text-sm text-secondary">
            {scanToPay ? (
              <>
                Open JazzCash, Easypaisa or your bank app, scan a code and send exactly{" "}
                {formatPrice(data.amount)}, quoting{" "}
                <strong className="numeric text-primary">{data.orderNumber}</strong>. The order is
                marked paid as soon as they confirm it arrived — this page updates on its own.
              </>
            ) : (
              <>
                Rather not pay cash? Scan your rider&apos;s code at the door and send{" "}
                {formatPrice(data.amount)}. They confirm it on their phone before they leave.
              </>
            )}
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-xs font-bold text-warning">
          <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-current" />
          Awaiting confirmation
        </span>
      </div>

      {restaurantCodes.length > 0 && (
        <section className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-primary">Pay {data.restaurant.name}</h4>
          <PaymentQrList codes={restaurantCodes} />
        </section>
      )}

      {rider !== null && (
        <section className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-primary">
            {restaurantCodes.length > 0
              ? `Or pay your rider, ${rider.name}, at the door`
              : `Pay your rider, ${rider.name}`}
          </h4>
          <PaymentQrList codes={rider.codes} />
        </section>
      )}
    </Card>
  );
}
