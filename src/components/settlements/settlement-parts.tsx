"use client";

import { ArrowDownLeft, ArrowUpRight, HandCoins, Receipt } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Panel } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Badge } from "@/components/ui/status-pill";
import { useValueChanged } from "@/hooks/use-value-changed";
import { ApiError } from "@/lib/api-client";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-labels";
import { cn, formatDateTime, formatPrice, hasText } from "@/lib/utils";
import { RiderSettlementDirection } from "@/types/enums";
import type { RiderLedgerEntryDto, RiderSettlementDto } from "@/types/rider";

/** Whose side of the counter is looking at the numbers. */
export type SettlementViewer = "rider" | "restaurant";

/**
 * A balance in words, from the viewer's side.
 *
 * `balance` is always "what the rider owes the restaurant", so the same number
 * reads as a debt to one side and money due to the other.
 */
export function describeBalance(balance: number, viewer: SettlementViewer) {
  if (Math.abs(balance) < 0.01) {
    return { label: "Settled", tone: "neutral" as const };
  }

  const riderOwes = balance > 0;
  const viewerOwes = viewer === "rider" ? riderOwes : !riderOwes;

  return {
    label: `${viewerOwes ? "You owe" : "Owes you"} ${formatPrice(Math.abs(balance))}`,
    tone: viewerOwes ? ("owe" as const) : ("owed" as const),
  };
}

export function BalanceBadge({ balance, viewer }: { balance: number; viewer: SettlementViewer }) {
  const { label, tone } = describeBalance(balance, viewer);

  return (
    <span
      className={cn(
        "numeric inline-flex items-center rounded-full px-3 py-1 text-sm font-bold",
        tone === "owe" && "bg-accent-warm-soft text-accent-warm",
        tone === "owed" && "bg-success-soft text-success",
        tone === "neutral" && "bg-surface-muted text-muted",
      )}
    >
      {label}
    </span>
  );
}

/**
 * Records money that reached the viewer.
 *
 * Only the receiving side ever sees this form: whoever got the money is the only
 * one who can honestly say it arrived. The amount starts at the full balance —
 * the common case is clearing it — and the API refuses anything more.
 */
export function RecordReceiptModal({
  open,
  title,
  description,
  max,
  onSubmit,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  max: number;
  onSubmit: (amount: number, note: string | undefined) => Promise<unknown>;
  onClose: () => void;
}) {
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  if (useValueChanged(open) && open) {
    setAmount(String(max));
    setNote("");
    setError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter the amount you received.");
      return;
    }

    if (value > max) {
      setError(`Only ${formatPrice(max)} is owed.`);
      return;
    }

    setError(null);
    setPending(true);

    try {
      await onSubmit(value, hasText(note) ? note.trim() : undefined);
      toast.success(`${formatPrice(value)} recorded.`);
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That did not go through.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="sm">
        <form onSubmit={submit}>
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
            <ModalDescription>{description}</ModalDescription>
          </ModalHeader>

          <ModalBody className="flex flex-col gap-4">
            <Field
              label="Amount received (Rs.)"
              htmlFor="receipt-amount"
              hint={`Up to ${formatPrice(max)}.`}
              error={error ?? undefined}
            >
              <Input
                id="receipt-amount"
                type="number"
                inputMode="decimal"
                min={1}
                max={max}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </Field>
            <Field label="Note" htmlFor="receipt-note" hint="Optional, e.g. cash at the counter.">
              <Input
                id="receipt-note"
                value={note}
                maxLength={300}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Record
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

type Query<T> = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data?: { items: T[] };
  refetch: () => unknown;
};

function ListRows({ count }: { count: number }) {
  return (
    <ul className="divide-y divide-border-subtle">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="h-[4.5rem] animate-pulse bg-surface-muted/40" />
      ))}
    </ul>
  );
}

/** One row per delivered order: what it added to the balance. */
export function LedgerEntriesPanel({
  query,
  viewer,
}: {
  query: Query<RiderLedgerEntryDto>;
  viewer: SettlementViewer;
}) {
  return (
    <Panel
      title="Per order"
      description="What each delivery added. The rider keeps the delivery fee and tip; the rest of any cash collected belongs to the business."
      bodyClassName="p-0"
    >
      {query.isPending ? (
        <ListRows count={4} />
      ) : query.isError || query.data === undefined ? (
        <ErrorState density="inline" error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          density="inline"
          icon={<Receipt className="size-6" />}
          title="No deliveries yet"
          description="Delivered orders show up here the moment the customer's code is confirmed."
        />
      ) : (
        <ul className="divide-y divide-border-subtle">
          {query.data.items.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-primary">
                    {viewer === "rider" ? entry.restaurantName : entry.riderName}
                  </span>
                  <Badge variant="outline" size="sm" className="numeric">
                    {entry.orderNumber}
                  </Badge>
                </div>
                <span className="text-xs text-muted">
                  {PAYMENT_METHOD_LABELS[entry.paymentMethod] ?? entry.paymentMethod}
                  {" · "}
                  {entry.collectedAmount > 0
                    ? `rider collected ${formatPrice(entry.collectedAmount)}`
                    : "paid to the business"}
                  {" · "}
                  rider fee {formatPrice(entry.riderFee)}
                  {" · "}
                  {formatDateTime(entry.createdAt)}
                </span>
              </div>
              <BalanceBadge balance={entry.netAmount} viewer={viewer} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Cash handed over and fees paid, as confirmed by whoever received them. */
export function SettlementPaymentsPanel({
  query,
  viewer,
}: {
  query: Query<RiderSettlementDto>;
  viewer: SettlementViewer;
}) {
  return (
    <Panel
      title="Money that changed hands"
      description="Each line was confirmed by the side that received the money."
      bodyClassName="p-0"
    >
      {query.isPending ? (
        <ListRows count={3} />
      ) : query.isError || query.data === undefined ? (
        <ErrorState density="inline" error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          density="inline"
          icon={<HandCoins className="size-6" />}
          title="Nothing recorded yet"
          description="Cash handovers and fee payments appear here once they are confirmed."
        />
      ) : (
        <ul className="divide-y divide-border-subtle">
          {query.data.items.map((payment) => {
            const toRestaurant = payment.direction === RiderSettlementDirection.RIDER_TO_RESTAURANT;
            const incoming = viewer === "restaurant" ? toRestaurant : !toRestaurant;

            return (
              <li
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl",
                      incoming ? "bg-success-soft text-success" : "bg-accent-warm-soft text-accent-warm",
                    )}
                  >
                    {incoming ? (
                      <ArrowDownLeft className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-semibold text-primary">
                      {toRestaurant
                        ? `Cash handed to ${payment.restaurantName}`
                        : `Fees paid to ${payment.riderName}`}
                    </span>
                    <span className="text-xs text-muted">
                      {formatDateTime(payment.createdAt)}
                      {payment.recordedByName !== null &&
                        ` · confirmed by ${payment.recordedByName}`}
                      {payment.note !== null && ` · ${payment.note}`}
                    </span>
                  </div>
                </div>
                <span
                  className={cn("numeric font-bold", incoming ? "text-success" : "text-accent-warm")}
                >
                  {incoming ? "+" : "−"}
                  {formatPrice(payment.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
