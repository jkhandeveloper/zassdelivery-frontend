"use client";

import { AlertTriangle, Inbox } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { PaymentQrEditor } from "@/components/payments/payment-qr-editor";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import {
  useBillingInvoices,
  useBillingSubscriptions,
  useConfirmTransfer,
  useDefaultFee,
  useDisableVendor,
  useEnableVendor,
  usePlatformQrCodes,
  useRecordPayment,
  useRejectTransfer,
  useSetDefaultFee,
  useSetMonthlyFee,
  useSetPlatformQrCodes,
  useUpdatePaymentRecord,
} from "@/hooks/use-billing";
import { ApiError } from "@/lib/api-client";
import { QR_PROVIDER_LABELS, QR_PROVIDER_ORDER } from "@/lib/payment-labels";
import { formatDate, formatPrice, hasText } from "@/lib/utils";
import type { SubscriptionDto, SubscriptionInvoiceDto } from "@/types/billing";
import { SubscriptionInvoiceStatus, SubscriptionStatus } from "@/types/enums";

/**
 * The platform's side of vendor subscriptions.
 *
 * Two jobs, in the order they matter: transfers waiting to be checked — money
 * sitting unconfirmed, and a vendor waiting on an answer — and then the roll of
 * who is paid up and who is close to being cut off.
 */
export function AdminBillingView() {
  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Vendor billing"
        description="Monthly platform fees. Vendors transfer to our own QR codes, so someone here has to confirm the money arrived."
      />
      <PendingTransfers />
      <DefaultFeePanel />
      <PlatformQrPanel />
      <Subscriptions />
    </div>
  );
}

/**
 * The platform's own QR codes — where a vendor sends the monthly fee.
 *
 * The same editor the vendor uses for their customer-facing codes, because it
 * is the same job: upload the image, name the account, save the list whole.
 */
function PlatformQrPanel() {
  const { data, isPending, isError, error, refetch } = usePlatformQrCodes();
  const save = useSetPlatformQrCodes();

  return (
    <Panel
      title="Where vendors pay us"
      description="What a vendor is shown when their monthly fee falls due. Saving replaces the whole list, so a removed code is really gone."
    >
      {isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : isError || data === undefined ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="flex flex-col gap-4">
          {data.length === 0 && (
            <p className="flex items-start gap-3 rounded-[var(--radius-input)] bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                Nothing published yet, so no vendor can pay. Their billing screen tells them to
                contact support, and the nightly sweep will not close anyone while this list is
                empty — nobody is suspended over an invoice they had no way to settle.
              </span>
            </p>
          )}

          <PaymentQrEditor
            codes={data}
            defaultAccountTitle="ZassDelivery"
            saving={save.isPending}
            onSave={(codes) =>
              save.mutate(
                { codes },
                {
                  onSuccess: () => toast.success("Payment details saved"),
                  onError: (error) =>
                    toast.error(
                      error instanceof ApiError
                        ? error.message
                        : "We couldn't save those QR codes.",
                    ),
                },
              )
            }
          />
        </div>
      )}
    </Panel>
  );
}

function PendingTransfers() {
  const { data, isPending, isError, error, refetch } = useBillingInvoices({
    status: SubscriptionInvoiceStatus.PENDING_REVIEW,
    limit: 25,
  });

  return (
    <Panel
      title="Transfers awaiting review"
      description="A vendor says they've paid. Confirm it and they're covered for the month; reject it and the invoice goes back to unpaid."
      bodyClassName={isPending || isError ? undefined : "p-0"}
    >
      {isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : isError || data === undefined ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-8" />}
          title="Nothing waiting"
          description="Every reported transfer has been dealt with."
        />
      ) : (
        <ul className="divide-y divide-border-subtle">
          {data.items.map((invoice) => (
            <TransferRow key={invoice.id} invoice={invoice} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function TransferRow({ invoice }: { invoice: SubscriptionInvoiceDto }) {
  const confirm = useConfirmTransfer();
  const reject = useRejectTransfer();
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const busy = confirm.isPending || reject.isPending;

  return (
    <li className="flex flex-col gap-4 px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-semibold text-primary">{invoice.restaurant.name}</p>
          <p className="text-xs text-muted">
            {invoice.invoiceNumber} · {formatDate(invoice.periodStart)} –{" "}
            {formatDate(invoice.periodEnd)}
          </p>
          {invoice.owner !== null && (
            <p className="text-xs text-muted">
              {invoice.owner.fullName} · {invoice.owner.phone}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="numeric font-display text-xl font-extrabold text-primary">
            {formatPrice(invoice.amount)}
          </span>
          <span className="text-xs text-muted">
            {invoice.channel === null ? "—" : QR_PROVIDER_LABELS[invoice.channel]}
            {hasText(invoice.reference) ? ` · TID ${invoice.reference}` : ""}
          </span>
          <span className="text-xs text-muted">
            Reported {formatDate(invoice.submittedAt)}
          </span>
        </div>
      </div>

      {invoice.proofImageUrl !== null && (
        <a
          href={invoice.proofImageUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-brand underline underline-offset-2"
        >
          View the vendor&apos;s screenshot
        </a>
      )}

      {rejecting ? (
        <form
          className="flex flex-col gap-3 rounded-[var(--radius-input)] bg-surface-muted p-4"
          onSubmit={(event) => {
            event.preventDefault();

            reject.mutate(
              { invoiceId: invoice.id, data: { reason: reason.trim() } },
              {
                onSuccess: () => {
                  toast.success("Vendor told, invoice back to unpaid");
                  setRejecting(false);
                  setReason("");
                },
                onError: (error) =>
                  toast.error(
                    error instanceof ApiError ? error.message : "We couldn't reject that.",
                  ),
              },
            );
          }}
        >
          <Field
            label="Why not?"
            hint="The vendor sees this word for word, so say what they should do next."
          >
            <Textarea
              required
              minLength={10}
              rows={3}
              value={reason}
              placeholder="No transfer with that TID reached our Easypaisa account on 12 September."
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="danger" loading={reject.isPending}>
              Reject this transfer
            </Button>
            <Button type="button" variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            loading={confirm.isPending}
            disabled={busy}
            onClick={() =>
              confirm.mutate(invoice.id, {
                onSuccess: () => toast.success(`${invoice.restaurant.name} is paid up`),
                onError: (error) =>
                  toast.error(
                    error instanceof ApiError ? error.message : "We couldn't confirm that.",
                  ),
              })
            }
          >
            Confirm payment received
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => setRejecting(true)}>
            Reject
          </Button>
        </div>
      )}
    </li>
  );
}

/**
 * The rate every vendor pays unless they have one of their own.
 *
 * Changing it is not a quiet configuration edit: it re-prices what standard-rate
 * vendors currently owe and tells each of them the new figure, which is the
 * whole reason it lives on this screen rather than buried in settings.
 */
function DefaultFeePanel() {
  const { data, isPending, isError, error, refetch } = useDefaultFee();
  const save = useSetDefaultFee();

  // Null means "untouched, show whatever the server says". Derived at render
  // rather than synced in an effect: an effect that seeds state from fetched
  // data costs a second render, and goes stale the moment a refetch lands.
  const [draft, setDraft] = React.useState<string | null>(null);
  const value = draft ?? (data === undefined ? "" : String(data.monthlyFee));

  return (
    <Panel
      title="Standard monthly fee"
      description="What a vendor pays unless they're on a rate of their own. Saving re-prices their current unpaid invoice and tells them what they now owe."
    >
      {isPending ? (
        <Skeleton className="h-16 w-full" />
      ) : isError || data === undefined ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const amount = Number(value);
            if (!Number.isFinite(amount) || amount < 0) return;

            save.mutate(
              { monthlyFee: amount },
              {
                onSuccess: (next) => {
                  // Back to following the server, so a later change elsewhere
                  // is not masked by a stale draft.
                  setDraft(null);
                  toast.success(`Standard fee is now ${formatPrice(next.monthlyFee)}`);
                },
                onError: (error) =>
                  toast.error(
                    error instanceof ApiError ? error.message : "We couldn't change the fee.",
                  ),
              },
            );
          }}
        >
          <Field label="Monthly fee (PKR)" className="w-48">
            <Input
              type="number"
              min={0}
              step="0.01"
              className="numeric"
              value={value}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Field>
          <Button type="submit" loading={save.isPending}>
            Save fee
          </Button>
          <p className="text-xs text-muted">
            Vendors on a negotiated rate keep theirs.
          </p>
        </form>
      )}
    </Panel>
  );
}

/**
 * One vendor's rate and their payment history, folded away until asked for.
 *
 * Collapsed by default because the roll above is what an operator scans; this
 * is what they open when a particular vendor is the question.
 */
function VendorDetail({ subscription }: { subscription: SubscriptionDto }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button size="sm" variant="ghost" onClick={() => setOpen((current) => !current)}>
          {open ? "Hide payments & rate" : "Payments & rate"}
        </Button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 rounded-[var(--radius-input)] border border-border-subtle p-4">
          <RateEditor subscription={subscription} />
          <PaymentHistory subscription={subscription} />
        </div>
      )}
    </div>
  );
}

/** This vendor's own rate, or null to put them back on the platform's. */
function RateEditor({ subscription }: { subscription: SubscriptionDto }) {
  const save = useSetMonthlyFee();
  const [value, setValue] = React.useState(
    subscription.hasCustomRate ? String(subscription.monthlyFee) : "",
  );

  const apply = (monthlyFee: number | null) =>
    save.mutate(
      { subscriptionId: subscription.id, data: { monthlyFee } },
      {
        onSuccess: (next) =>
          toast.success(
            monthlyFee === null
              ? `${next.restaurant.name} is back on the standard rate`
              : `${next.restaurant.name} now pays ${formatPrice(next.monthlyFee)}`,
          ),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "We couldn't change the rate."),
      },
    );

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount < 0) return;
        apply(amount);
      }}
    >
      <Field
        label="This vendor's rate (PKR)"
        hint="Leave the standard rate in place unless you've agreed something else."
        className="w-56"
      >
        <Input
          type="number"
          min={0}
          step="0.01"
          className="numeric"
          placeholder={String(subscription.monthlyFee)}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
      <Button type="submit" size="sm" loading={save.isPending}>
        Save rate
      </Button>
      {subscription.hasCustomRate && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setValue("");
            apply(null);
          }}
        >
          Use standard rate
        </Button>
      )}
    </form>
  );
}

/** Month by month: what was billed, what was paid, and how. */
function PaymentHistory({ subscription }: { subscription: SubscriptionDto }) {
  const { data, isPending, isError, error, refetch } = useBillingInvoices({
    restaurantId: subscription.restaurant.id,
    limit: 24,
  });

  if (isPending) return <Skeleton className="h-24 w-full" />;
  if (isError || data === undefined) return <ErrorState error={error} onRetry={refetch} />;

  const paid = data.items.filter((invoice) => invoice.status === SubscriptionInvoiceStatus.PAID);
  const total = paid.reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold text-primary">Payment history</h4>
        <p className="text-xs text-muted">
          {paid.length} paid · {formatPrice(total)} collected
        </p>
      </div>

      {data.items.length === 0 ? (
        <p className="text-sm text-secondary">Nothing billed yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.items.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </ul>
      )}
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: SubscriptionInvoiceDto }) {
  const [editing, setEditing] = React.useState(false);
  const settled = invoice.status === SubscriptionInvoiceStatus.PAID;
  const closed = settled || invoice.status === SubscriptionInvoiceStatus.VOID;

  return (
    <li className="flex flex-col gap-2 rounded-[var(--radius-input)] bg-surface-muted px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-sm font-medium text-primary">
            {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
            {invoice.isTrial && <span className="ml-2 text-xs text-muted">free month</span>}
          </p>
          <p className="text-xs text-muted">
            {invoice.invoiceNumber}
            {settled ? ` · paid ${formatDate(invoice.paidAt)}` : ""}
            {invoice.channel !== null ? ` · ${QR_PROVIDER_LABELS[invoice.channel]}` : ""}
            {hasText(invoice.reference) ? ` · TID ${invoice.reference}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="numeric text-sm font-semibold text-primary">
            {formatPrice(invoice.amount)}
          </span>
          <StatusPill status={invoice.status} />
          {/* A waived month has nothing to record and nothing to correct. */}
          {!invoice.isTrial && invoice.status !== SubscriptionInvoiceStatus.VOID && (
            <Button size="sm" variant="ghost" onClick={() => setEditing((current) => !current)}>
              {editing ? "Cancel" : settled ? "Edit" : "Record"}
            </Button>
          )}
        </div>
      </div>

      {editing && !closed && (
        <PaymentForm invoice={invoice} mode="record" onDone={() => setEditing(false)} />
      )}
      {editing && settled && (
        <PaymentForm invoice={invoice} mode="correct" onDone={() => setEditing(false)} />
      )}
    </li>
  );
}

/**
 * Entering a payment, or correcting one already entered.
 *
 * The same three fields either way — which wallet, which transaction ID, and
 * when the money actually landed. Recording settles the invoice; correcting
 * does not touch the ledger entry, because the money only moved once.
 */
function PaymentForm({
  invoice,
  mode,
  onDone,
}: {
  invoice: SubscriptionInvoiceDto;
  mode: "record" | "correct";
  onDone: () => void;
}) {
  const record = useRecordPayment();
  const correct = useUpdatePaymentRecord();
  const busy = record.isPending || correct.isPending;

  const [channel, setChannel] = React.useState(invoice.channel ?? "EASYPAISA");
  const [reference, setReference] = React.useState(invoice.reference ?? "");
  const [paidAt, setPaidAt] = React.useState(
    (invoice.paidAt ?? new Date().toISOString()).slice(0, 10),
  );

  return (
    <form
      className="grid grid-cols-1 gap-3 sm:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();

        const data = {
          channel,
          ...(reference.trim() !== "" && { reference: reference.trim() }),
          paidAt: new Date(paidAt).toISOString(),
        };

        const handlers = {
          onSuccess: () => {
            toast.success(mode === "record" ? "Payment recorded" : "Payment details corrected");
            onDone();
          },
          onError: (error: unknown) =>
            toast.error(
              error instanceof ApiError ? error.message : "We couldn't save that payment.",
            ),
        };

        if (mode === "record") {
          record.mutate({ invoiceId: invoice.id, data }, handlers);
        } else {
          correct.mutate({ invoiceId: invoice.id, data }, handlers);
        }
      }}
    >
      <Field label="Paid with">
        <NativeSelect
          value={channel}
          onChange={(event) => setChannel(event.target.value as typeof channel)}
        >
          {QR_PROVIDER_ORDER.map((provider) => (
            <option key={provider} value={provider}>
              {QR_PROVIDER_LABELS[provider]}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="Transaction ID">
        <Input
          value={reference}
          placeholder="012345678901"
          className="numeric"
          onChange={(event) => setReference(event.target.value)}
        />
      </Field>

      <Field label="Date received">
        <Input type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
      </Field>

      <div className="flex items-end">
        <Button type="submit" size="sm" loading={busy}>
          {mode === "record" ? "Record payment" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

/**
 * Turning a vendor's account on and off by hand.
 *
 * The wording matters more than the buttons. Closing here is the platform's own
 * decision, so a later payment will not undo it — and an account the *sweep*
 * closed says so, because confirming that vendor's transfer reopens them
 * without anyone touching this.
 */
function VendorControls({ subscription }: { subscription: SubscriptionDto }) {
  const disable = useDisableVendor();
  const enable = useEnableVendor();
  const [closing, setClosing] = React.useState(false);
  const [reason, setReason] = React.useState("");

  if (subscription.status === SubscriptionStatus.SUSPENDED) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          loading={enable.isPending}
          onClick={() =>
            enable.mutate(subscription.id, {
              onSuccess: () =>
                toast.success(`${subscription.restaurant.name} is taking orders again`),
              onError: (error) =>
                toast.error(
                  error instanceof ApiError ? error.message : "We couldn't reopen that listing.",
                ),
            })
          }
        >
          Enable account
        </Button>
        <p className="text-xs text-muted">
          {subscription.suspendedForNonPayment
            ? "Closed automatically for non-payment. Confirming their transfer reopens them too."
            : "Closed by an administrator, so paying will not reopen it — only you can."}
        </p>
      </div>
    );
  }

  if (closing) {
    return (
      <form
        className="flex flex-col gap-3 rounded-[var(--radius-input)] bg-surface-muted p-4"
        onSubmit={(event) => {
          event.preventDefault();

          disable.mutate(
            { subscriptionId: subscription.id, data: { reason: reason.trim() } },
            {
              onSuccess: () => {
                toast.success(`${subscription.restaurant.name} has been closed`);
                setClosing(false);
                setReason("");
              },
              onError: (error) =>
                toast.error(
                  error instanceof ApiError ? error.message : "We couldn't close that listing.",
                ),
            },
          );
        }}
      >
        <Field
          label="Why are you closing this account?"
          hint="The vendor sees this on their own screens, so say what it is and who to talk to."
        >
          <Textarea
            required
            minLength={10}
            rows={2}
            value={reason}
            placeholder="Closed pending a food-safety review. Call the office to discuss."
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" variant="danger" loading={disable.isPending}>
            Close this account
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setClosing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <Button size="sm" variant="outline" onClick={() => setClosing(true)}>
        Disable account
      </Button>
    </div>
  );
}

function Subscriptions() {
  const [status, setStatus] = React.useState<SubscriptionStatus | "">("");
  const [search, setSearch] = React.useState("");

  const { data, isPending, isError, error, refetch } = useBillingSubscriptions({
    limit: 25,
    ...(status !== "" && { status }),
    ...(search.trim() !== "" && { search: search.trim() }),
  });

  return (
    <Panel
      title="Subscriptions"
      description="Ordered by whoever is closest to their next due date — which is whoever is closest to being cut off."
      bodyClassName="p-0"
      action={
        <div className="flex flex-wrap items-end gap-2">
          <Input
            value={search}
            placeholder="Restaurant, owner or phone"
            aria-label="Search subscriptions"
            onChange={(event) => setSearch(event.target.value)}
          />
          <NativeSelect
            value={status}
            aria-label="Filter by status"
            onChange={(event) => setStatus(event.target.value as SubscriptionStatus | "")}
          >
            <option value="">All statuses</option>
            {Object.values(SubscriptionStatus).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </NativeSelect>
        </div>
      }
    >
      {isPending ? (
        <div className="p-5 sm:p-6">
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError || data === undefined ? (
        <div className="p-5 sm:p-6">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      ) : data.items.length === 0 ? (
        <p className="p-5 text-sm text-secondary sm:p-6">No subscriptions match that.</p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {data.items.map((subscription) => (
            <li key={subscription.id} className="flex flex-col gap-3 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-sm font-semibold text-primary">
                    {subscription.restaurant.name}
                  </p>
                  {subscription.owner !== null && (
                    <p className="text-xs text-muted">
                      {subscription.owner.fullName} · {subscription.owner.phone}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="numeric text-sm font-semibold text-primary">
                      {formatPrice(subscription.monthlyFee)}
                      {subscription.hasCustomRate && (
                        <span className="ml-1 text-xs font-normal text-muted">agreed</span>
                      )}
                    </span>
                    <span className="text-xs text-muted">
                      Due {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                  {subscription.daysUntilDue < 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-danger">
                      <AlertTriangle aria-hidden className="size-3.5" />
                      {Math.abs(subscription.daysUntilDue)}d overdue
                    </span>
                  )}
                  <StatusPill status={subscription.status} />
                </div>
              </div>

              <VendorControls subscription={subscription} />
              <VendorDetail subscription={subscription} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
