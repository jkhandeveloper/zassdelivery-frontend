"use client";

import {
  Bike,
  CheckCircle2,
  MapPin,
  Package,
  Phone,
  QrCode,
  Store,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Panel } from "@/components/layout/portal-page";
import { MarkPaymentReceivedButton } from "@/components/payments/mark-received-button";
import { PaymentQrList } from "@/components/payments/payment-qr-list";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/modal";
import { StatusPill } from "@/components/ui/status-pill";
import {
  useConfirmDelivery,
  useIssueDeliveryCode,
  useMarkOnTheWay,
  useRiderProfile,
} from "@/hooks/use-riders";
import { ApiError } from "@/lib/api-client";
import { cn, formatPrice, hasText } from "@/lib/utils";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@/types/enums";
import type { AssignmentDto } from "@/types/rider";

/**
 * The run in the rider's hands.
 *
 * The steps are driven by the order's own status rather than by local state:
 * the API owns the state machine (READY_FOR_PICKUP → PICKED_UP → ON_THE_WAY →
 * DELIVERED) and rejects anything out of order, so mirroring it here would only
 * produce a button that disagrees with the server.
 */
export function DeliveryPanel({ assignment }: { assignment: AssignmentDto }) {
  const { order } = assignment;

  const issueCode = useIssueDeliveryCode();
  const markOnTheWay = useMarkOnTheWay();
  const confirm = useConfirmDelivery();
  const [code, setCode] = React.useState("");

  const fail = (error: unknown, fallback: string) =>
    toast.error(error instanceof ApiError ? error.message : fallback);

  const scanToPay = order.paymentMethod === PaymentMethod.QR_TRANSFER;

  // The rider has the order and is heading for the door, and the money is
  // still owed in a form a person — not a gateway — confirms.
  const takingPayment =
    order.paymentStatus === PaymentStatus.PENDING &&
    (scanToPay || order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY) &&
    (order.status === OrderStatus.PICKED_UP || order.status === OrderStatus.ON_THE_WAY);

  return (
    <Panel
      title={`Order ${order.orderNumber}`}
      description={order.restaurantName}
      action={<StatusPill status={order.status} withDot />}
      bodyClassName="flex flex-col gap-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Stop
          icon={<Store className="size-4" />}
          label="Collect from"
          name={order.restaurantName}
          address={order.restaurantAddress}
          phone={order.restaurantPhone}
        />
        <Stop
          icon={<MapPin className="size-4" />}
          label="Deliver to"
          name={order.customerName}
          address={order.deliveryAddress}
          landmark={order.deliveryLandmark}
          phone={order.customerPhone}
          notes={order.deliveryNotes}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[var(--radius-input)] bg-surface-muted px-4 py-3 text-sm">
        <span className="numeric inline-flex items-center gap-1.5 font-semibold text-primary">
          <Wallet aria-hidden className="size-4 text-muted" />
          Earning {formatPrice(assignment.estimatedEarning)}
        </span>
        {order.distanceKm !== null && (
          <span className="numeric inline-flex items-center gap-1.5 text-secondary">
            <Bike aria-hidden className="size-4 text-muted" />
            {order.distanceKm.toFixed(1)} km
          </span>
        )}
        {order.cashToCollect > 0 && (
          <span className="numeric inline-flex items-center gap-1.5 font-bold text-accent-warm">
            <Package aria-hidden className="size-4" />
            Collect {formatPrice(order.cashToCollect)} cash
          </span>
        )}
        {scanToPay && order.paymentStatus === PaymentStatus.PENDING && (
          <span className="inline-flex items-center gap-1.5 font-bold text-warning">
            <QrCode aria-hidden className="size-4" />
            Scan &amp; pay — no cash to collect
          </span>
        )}
      </div>

      {takingPayment && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border-subtle p-4">
          <div className="flex flex-col gap-1">
            <p className="font-bold text-primary">
              {scanToPay ? "Customer is paying by QR" : "Paying by QR instead of cash?"}
            </p>
            <p className="text-sm text-secondary">
              {scanToPay
                ? "They were shown the restaurant's code, so don't ask for cash. If they'd rather pay you, show your code and confirm once it lands."
                : "Show the customer your code, and confirm once the transfer shows in your app — then there's no cash to collect."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ShowMyQrButton />
            <MarkPaymentReceivedButton
              orderId={order.id}
              orderNumber={order.orderNumber}
              amount={order.totalAmount}
              label="I've received it"
            />
          </div>
        </div>
      )}

      {/* ── The one action that is next ─────────────────────── */}
      {order.status === OrderStatus.READY_FOR_PICKUP && (
        <Step
          title="At the restaurant?"
          hint="Confirming pickup sends the customer a four-digit code you'll need at the door."
        >
          <Button
            loading={issueCode.isPending}
            onClick={() =>
              issueCode.mutate(order.id, {
                onSuccess: (result) => toast.success(result.message),
                onError: (error) => fail(error, "We couldn't confirm the pickup."),
              })
            }
          >
            I&apos;ve collected the order
          </Button>
        </Step>
      )}

      {order.status === OrderStatus.PICKED_UP && (
        <Step title="Order collected" hint="Start the run when you set off.">
          <Button
            loading={markOnTheWay.isPending}
            onClick={() =>
              markOnTheWay.mutate(order.id, {
                onSuccess: (result) => toast.success(result.message),
                onError: (error) => fail(error, "We couldn't start the run."),
              })
            }
          >
            I&apos;m on the way
          </Button>
        </Step>
      )}

      {order.status === OrderStatus.ON_THE_WAY && (
        <Step
          title="At the door"
          hint="Ask the customer for the four digits we sent them, then confirm."
        >
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (code.length !== 4) return;

              confirm.mutate(
                { orderId: order.id, data: { code } },
                {
                  onSuccess: (result) => {
                    toast.success(result.message);
                    setCode("");
                  },
                  onError: (error) => fail(error, "That code wasn't accepted."),
                },
              );
            }}
          >
            <Field label="Delivery code" htmlFor="delivery-code" className="w-40">
              <Input
                id="delivery-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="0000"
                className="numeric h-12 text-center text-xl tracking-[0.4em]"
              />
            </Field>
            <Button
              type="submit"
              variant="success"
              loading={confirm.isPending}
              disabled={code.length !== 4}
            >
              <CheckCircle2 className="size-4" />
              Confirm delivery
            </Button>
          </form>
        </Step>
      )}
    </Panel>
  );
}

/** The rider's own codes, full-screen enough to hold up to the customer. */
function ShowMyQrButton() {
  const profile = useRiderProfile();
  const codes = profile.data?.paymentQrCodes ?? [];

  return (
    <Modal>
      <ModalTrigger asChild>
        <Button size="sm" variant="outline">
          <QrCode className="size-4" />
          Show my QR
        </Button>
      </ModalTrigger>
      <ModalContent size="md">
        <ModalHeader>
          <ModalTitle>Scan to pay me</ModalTitle>
          <ModalDescription>
            Turn the screen to the customer. Once the transfer shows in your app, close this and
            confirm it.
          </ModalDescription>
        </ModalHeader>
        <ModalBody className="pb-6">
          {codes.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-secondary">You haven&apos;t added a QR code yet.</p>
              <Button asChild size="sm">
                <Link href="/rider/payment-qr">Add my QR codes</Link>
              </Button>
            </div>
          ) : (
            <PaymentQrList codes={codes} />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-brand/30 bg-brand-soft p-4">
      <div className="flex flex-col gap-1">
        <p className="font-bold text-primary">{title}</p>
        <p className="text-sm text-secondary">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function Stop({
  icon,
  label,
  name,
  address,
  landmark,
  phone,
  notes,
}: {
  icon: React.ReactNode;
  label: string;
  name: string | null;
  address: string;
  landmark?: string | null;
  phone: string | null;
  notes?: string | null;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-border-subtle p-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
        <span aria-hidden>{icon}</span>
        {label}
      </p>

      {/* Customer details are withheld by the API until the run is accepted,
          so a null name here is a permission boundary, not missing data. */}
      <p className="flex items-center gap-2 font-bold text-primary">
        {hasText(name) ? (
          name
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
            <User aria-hidden className="size-3.5" />
            Shown once you accept
          </span>
        )}
      </p>

      <p className="text-sm text-secondary">{address}</p>
      {hasText(landmark) && <p className="text-xs text-muted">{landmark}</p>}
      {hasText(notes) && (
        <p className="rounded-[var(--radius-input)] bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
          {notes}
        </p>
      )}

      {hasText(phone) && (
        <a
          href={`tel:${phone}`}
          className={cn(
            "mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5",
            "text-sm font-bold text-brand transition-colors hover:bg-brand-soft",
          )}
        >
          <Phone aria-hidden className="size-3.5" />
          {phone}
        </a>
      )}
    </div>
  );
}
