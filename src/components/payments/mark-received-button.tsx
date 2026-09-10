"use client";

import { BadgeCheck } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/modal";
import { useMarkPaymentReceived } from "@/hooks/use-payments";
import { ApiError } from "@/lib/api-client";
import { QR_PROVIDER_LABELS, QR_PROVIDER_ORDER } from "@/lib/payment-labels";
import { cn, formatPrice } from "@/lib/utils";
import { PaymentQrProvider } from "@/types/enums";

/**
 * Confirms a scanned-QR transfer reached the person pressing it.
 *
 * Behind a dialog rather than a one-tap button because it turns "not paid" into
 * "paid" for the customer on nothing but this person's word — so it asks which
 * app the money came through and, optionally, the TID, which the API will not
 * accept twice.
 */
export function MarkPaymentReceivedButton({
  orderId,
  orderNumber,
  amount,
  label = "Payment received",
  size = "sm",
  variant = "outline",
  className,
}: {
  orderId: string;
  orderNumber: string;
  amount: number;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const mark = useMarkPaymentReceived();
  const [open, setOpen] = React.useState(false);
  const [channel, setChannel] = React.useState<PaymentQrProvider>(PaymentQrProvider.JAZZCASH);
  const [reference, setReference] = React.useState("");

  const tid = reference.trim();
  const tidTooShort = tid !== "" && tid.length < 4;

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button size={size} variant={variant} className={className}>
          <BadgeCheck className="size-4" />
          {label}
        </Button>
      </ModalTrigger>

      <ModalContent size="sm">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (tidTooShort) return;

            mark.mutate(
              { orderId, data: { channel, ...(tid !== "" && { reference: tid }) } },
              {
                onSuccess: () => {
                  toast.success(`Payment for ${orderNumber} confirmed`);
                  setOpen(false);
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
          <ModalHeader>
            <ModalTitle>Confirm payment received</ModalTitle>
            <ModalDescription>
              Only confirm once {formatPrice(amount)} for order {orderNumber} shows in your app —
              the customer is told the order is paid.
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="flex flex-col gap-5">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-primary">Received through</legend>
              <div className="grid grid-cols-2 gap-2">
                {QR_PROVIDER_ORDER.map((provider) => (
                  <label
                    key={provider}
                    className={cn(
                      "flex cursor-pointer items-center justify-center rounded-[var(--radius-input)] border px-3 py-2.5 text-sm font-bold transition-colors",
                      "focus-within:ring-4 focus-within:ring-[var(--brand-ring)]",
                      channel === provider
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-border-default bg-surface-muted text-secondary hover:border-brand",
                    )}
                  >
                    <input
                      type="radio"
                      name={`channel-${orderId}`}
                      value={provider}
                      checked={channel === provider}
                      onChange={() => setChannel(provider)}
                      className="sr-only"
                    />
                    {QR_PROVIDER_LABELS[provider]}
                  </label>
                ))}
              </div>
            </fieldset>

            <Field
              label="Transaction ID (TID)"
              htmlFor={`tid-${orderId}`}
              hint="Optional — it stops one transfer being used to pay for two orders."
              error={tidTooShort ? "That looks too short for a transaction ID." : undefined}
            >
              <Input
                id={`tid-${orderId}`}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="e.g. 012345678901"
                maxLength={120}
                autoComplete="off"
                className="numeric"
              />
            </Field>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={mark.isPending}
              disabled={tidTooShort}
            >
              Confirm received
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
