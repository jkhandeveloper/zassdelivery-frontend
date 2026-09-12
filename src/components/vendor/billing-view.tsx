"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, Receipt, ShieldAlert } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Panel, PortalHeader, StatGrid, StatTile } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { VendorGate } from "@/components/vendor/vendor-gate";
import { useSubmitTransfer, useVendorBilling, useVendorInvoices } from "@/hooks/use-billing";
import { ApiError } from "@/lib/api-client";
import { QR_PROVIDER_LABELS, QR_PROVIDER_ORDER, qrCodeName } from "@/lib/payment-labels";
import { formatDate, formatPrice, hasText } from "@/lib/utils";
import type { SubscriptionInvoiceDto, VendorBillingDto } from "@/types/billing";
import { SubscriptionInvoiceStatus, type PaymentQrProvider } from "@/types/enums";
import type { RestaurantAdminDto } from "@/types/restaurant";

/**
 * What the vendor owes the platform, and how they settle it.
 *
 * `allowSuspended` matters more here than anywhere else in the portal: a
 * listing closed for non-payment must still reach this screen, because paying
 * is the only thing that reopens it. Locking them out would leave the money
 * uncollected and the vendor with nothing to do but ring support.
 */
export function VendorBillingView() {
  return <VendorGate allowSuspended>{(restaurant) => <Billing restaurant={restaurant} />}</VendorGate>;
}

function Billing({ restaurant }: { restaurant: RestaurantAdminDto }) {
  const { data, isPending, isError, error, refetch } = useVendorBilling(restaurant.id);

  if (isPending) {
    return (
      <SkeletonRegion label="Loading your subscription" className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-[var(--radius-card)]" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-[var(--radius-panel)]" />
      </SkeletonRegion>
    );
  }

  if (isError || data === undefined) {
    // Billing only begins at approval, so a listing still in the queue has no
    // subscription. That is a sentence, not an error state.
    if (error instanceof ApiError && error.status === 404) {
      return (
        <EmptyState
          icon={<CalendarClock className="size-8" />}
          title="Billing hasn't started yet"
          description="Your first month begins the day this listing is approved, and it's free. We'll tell you the due date as soon as you're live."
        />
      );
    }

    return <ErrorState error={error} onRetry={refetch} />;
  }

  return <BillingScreen restaurantId={restaurant.id} billing={data} />;
}

function BillingScreen({
  restaurantId,
  billing,
}: {
  restaurantId: string;
  billing: VendorBillingDto;
}) {
  const { subscription, currentInvoice, payTo } = billing;
  const invoices = useVendorInvoices(restaurantId, { limit: 12 });

  const owes =
    currentInvoice !== null && currentInvoice.status !== SubscriptionInvoiceStatus.PAID;

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Subscription"
        description="What it costs to keep this listing on ZassDelivery, and how to pay it."
        action={<StatusPill status={subscription.status} />}
      />

      {subscription.suspendedForNonPayment && (
        <p className="flex items-start gap-3 rounded-[var(--radius-input)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            This listing is closed because the platform fee went unpaid. Pay the invoice below
            and we&apos;ll reopen you as soon as we&apos;ve confirmed the transfer.
          </span>
        </p>
      )}

      <StatGrid className="xl:grid-cols-3">
        <StatTile
          label="Monthly fee"
          value={formatPrice(subscription.monthlyFee)}
          icon={<Receipt className="size-4" />}
          tone="brand"
          hint={subscription.hasCustomRate ? "Your agreed rate" : "Standard rate"}
        />
        <StatTile
          label={subscription.isTrialing ? "Free month ends" : "Next payment due"}
          value={formatDate(subscription.currentPeriodEnd)}
          icon={<CalendarClock className="size-4" />}
          tone={subscription.daysUntilDue < 0 ? "warm" : "neutral"}
          hint={dueHint(subscription.daysUntilDue)}
        />
        <StatTile
          label="Status"
          value={subscription.statusText}
          icon={<CheckCircle2 className="size-4" />}
          tone={subscription.status === "ACTIVE" ? "success" : "neutral"}
          hint={
            subscription.lastPaidAt === null
              ? "No payment taken yet"
              : `Last paid ${formatDate(subscription.lastPaidAt)}`
          }
        />
      </StatGrid>

      {subscription.isTrialing && (
        <p className="flex items-start gap-3 rounded-[var(--radius-input)] bg-success-soft px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            Your first month is on us. Nothing to pay until{" "}
            {formatDate(subscription.currentPeriodEnd)}.
          </span>
        </p>
      )}

      {currentInvoice === null ? (
        <Panel title="Nothing to pay">
          <p className="text-sm text-secondary">
            You&apos;re paid up. We&apos;ll raise your next invoice when this period ends.
          </p>
        </Panel>
      ) : (
        <CurrentInvoice
          restaurantId={restaurantId}
          invoice={currentInvoice}
          payTo={payTo}
          owes={owes}
        />
      )}

      <Panel
        title="Billing history"
        description="Every month billed for this listing, the free first one included."
        bodyClassName="p-0"
      >
        {invoices.isPending ? (
          <div className="p-5 sm:p-6">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : invoices.data === undefined || invoices.data.items.length === 0 ? (
          <p className="p-5 text-sm text-secondary sm:p-6">No invoices yet.</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {invoices.data.items.map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-sm font-semibold text-primary">
                    {invoice.isTrial ? "Free first month" : invoice.invoiceNumber}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="numeric text-sm font-semibold text-primary">
                    {formatPrice(invoice.amount)}
                  </span>
                  <StatusPill status={invoice.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function dueHint(days: number): string {
  if (days < 0) {
    return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  }

  if (days === 0) {
    return "Due today";
  }

  return `In ${days} day${days === 1 ? "" : "s"}`;
}

function CurrentInvoice({
  restaurantId,
  invoice,
  payTo,
  owes,
}: {
  restaurantId: string;
  invoice: SubscriptionInvoiceDto;
  payTo: VendorBillingDto["payTo"];
  owes: boolean;
}) {
  const reviewing = invoice.status === SubscriptionInvoiceStatus.PENDING_REVIEW;

  return (
    <Panel
      title={reviewing ? "We're checking your transfer" : "What's due"}
      description={
        reviewing
          ? "You've told us this is paid. We'll confirm it shortly — your listing stays open in the meantime."
          : `Invoice ${invoice.invoiceNumber}, for the month from ${formatDate(invoice.periodStart)}.`
      }
      action={<StatusPill status={invoice.status} />}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p className="numeric font-display text-3xl font-extrabold text-primary">
            {formatPrice(invoice.amount)}
          </p>
          <p className="text-sm text-secondary">
            Due {formatDate(invoice.dueAt)} · listing closes {formatDate(invoice.blockAt)} if
            unpaid
          </p>
        </div>

        {hasText(invoice.rejectionReason) && (
          <p className="flex items-start gap-3 rounded-[var(--radius-input)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>{invoice.rejectionReason}</span>
          </p>
        )}

        {reviewing ? (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <Detail label="Sent via" value={channelLabel(invoice.channel)} />
            <Detail label="Transaction ID" value={invoice.reference ?? "—"} />
            <Detail label="Reported" value={formatDate(invoice.submittedAt)} />
          </dl>
        ) : (
          owes && <PayTo payTo={payTo} invoice={invoice} restaurantId={restaurantId} />
        )}
      </div>
    </Panel>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="text-sm text-primary">{value}</dd>
    </div>
  );
}

function channelLabel(channel: PaymentQrProvider | null): string {
  return channel === null ? "—" : QR_PROVIDER_LABELS[channel];
}

function PayTo({
  payTo,
  invoice,
  restaurantId,
}: {
  payTo: VendorBillingDto["payTo"];
  invoice: SubscriptionInvoiceDto;
  restaurantId: string;
}) {
  if (payTo.length === 0) {
    return (
      <p className="flex items-start gap-3 rounded-[var(--radius-input)] bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
        <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>
          We haven&apos;t published our payment details yet, so there&apos;s nowhere to send this
          — please contact support. Your listing won&apos;t be closed for an invoice you had no
          way to pay.
        </span>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-primary">Send the fee to any one of these</h3>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {payTo.map((code) => (
            <li
              key={code.imageUrl}
              className="flex gap-4 rounded-[var(--radius-input)] border border-border-subtle p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- the QR is
                  an absolute URL from our own storage, and next/image would
                  re-encode a code that has to stay scannable. */}
              <img
                src={code.imageUrl}
                alt={`${qrCodeName(code)} QR code`}
                className="size-24 shrink-0 rounded-lg object-contain"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-sm font-semibold text-primary">{qrCodeName(code)}</p>
                <p className="truncate text-sm text-secondary">{code.accountTitle}</p>
                {hasText(code.accountNumber) && (
                  <p className="numeric truncate text-xs text-muted">{code.accountNumber}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ReportTransferForm invoice={invoice} restaurantId={restaurantId} />
    </div>
  );
}

/**
 * Tells us the money has been sent.
 *
 * Deliberately not a "mark as paid" button: this records a claim, and the
 * platform confirms the transfer landed before anything is settled. The copy
 * says so, because a vendor who thinks they are done and then gets suspended
 * has been misled by the interface.
 */
function ReportTransferForm({
  invoice,
  restaurantId,
}: {
  invoice: SubscriptionInvoiceDto;
  restaurantId: string;
}) {
  const submit = useSubmitTransfer(restaurantId);
  const [channel, setChannel] = React.useState<PaymentQrProvider>("EASYPAISA");
  const [reference, setReference] = React.useState("");

  return (
    <form
      className="flex flex-col gap-4 rounded-[var(--radius-input)] bg-surface-muted p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();

        submit.mutate(
          {
            invoiceId: invoice.id,
            data: {
              channel,
              ...(reference.trim() !== "" && { reference: reference.trim() }),
            },
          },
          {
            onSuccess: () => {
              toast.success("Thanks — we'll confirm your payment shortly");
              setReference("");
            },
            onError: (error) =>
              toast.error(
                error instanceof ApiError ? error.message : "We couldn't record that payment.",
              ),
          },
        );
      }}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-primary">Already paid?</h3>
        <p className="text-xs text-secondary">
          Tell us how you sent it and we&apos;ll check it against our account.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Paid with">
          <NativeSelect
            value={channel}
            onChange={(event) => setChannel(event.target.value as PaymentQrProvider)}
          >
            {QR_PROVIDER_ORDER.map((provider) => (
              <option key={provider} value={provider}>
                {QR_PROVIDER_LABELS[provider]}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field
          label="Transaction ID"
          hint="The TID your wallet or bank app shows. It's how we find your transfer."
        >
          <Input
            value={reference}
            inputMode="numeric"
            placeholder="012345678901"
            onChange={(event) => setReference(event.target.value)}
          />
        </Field>
      </div>

      <div>
        <Button type="submit" loading={submit.isPending}>
          I&apos;ve sent the payment
        </Button>
      </div>
    </form>
  );
}
