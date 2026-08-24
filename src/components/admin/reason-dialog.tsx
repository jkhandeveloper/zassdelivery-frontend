"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { useValueChanged } from "@/hooks/use-value-changed";
import { ApiError } from "@/lib/api-client";
import { hasText } from "@/lib/utils";

/**
 * The prompt behind every destructive admin action.
 *
 * Rejecting a restaurant, suspending a rider, refusing a payout and refunding a
 * payment are the same interaction: confirm, and say why. The reason is not
 * decoration — it is written to the audit log and, for most of these, shown to
 * the person on the other end, so the field is required rather than optional.
 *
 * `amount` turns it into a refund prompt: same shape, one extra bounded number.
 */
export interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Label above the textarea. */
  reasonLabel?: string;
  placeholder?: string;
  confirmLabel: string;
  variant?: "danger" | "primary" | "success";
  /** Adds an amount field, capped at `max`. Omit for a reason-only prompt. */
  amount?: { label: string; max: number; hint?: string };
  /** Rejects to show an error; resolves to close. */
  onConfirm: (input: { reason: string; amount?: number }) => Promise<unknown>;
  /** Shown as a toast when the action succeeds. */
  successMessage: string;
  pending?: boolean;
}

export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  reasonLabel = "Reason",
  placeholder = "What happened, in a sentence.",
  confirmLabel,
  variant = "danger",
  amount,
  onConfirm,
  successMessage,
  pending = false,
}: ReasonDialogProps) {
  const [reason, setReason] = React.useState("");
  const [amountText, setAmountText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Reopening must not show the last attempt's text or its error.
  if (useValueChanged(open) && open) {
    setReason("");
    setAmountText("");
    setError(null);
  }

  const parsedAmount = amountText.trim() === "" ? undefined : Number(amountText);

  const amountInvalid =
    amount !== undefined &&
    parsedAmount !== undefined &&
    (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > amount.max);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!hasText(reason)) {
      setError("A reason is required — it goes on the audit trail.");

      return;
    }

    if (amountInvalid) {
      setError(`Enter an amount between 1 and ${amount?.max}.`);

      return;
    }

    setError(null);

    try {
      await onConfirm({ reason: reason.trim(), amount: parsedAmount });
      toast.success(successMessage);
      onOpenChange(false);
    } catch (caught) {
      // The API's message is written for a person; show it rather than a generic.
      setError(
        caught instanceof ApiError ? caught.message : "That did not go through. Try again.",
      );
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <form onSubmit={submit}>
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
            {description !== undefined && <ModalDescription>{description}</ModalDescription>}
          </ModalHeader>

          <ModalBody className="flex flex-col gap-4">
            {amount !== undefined && (
              <Field
                label={amount.label}
                htmlFor="reason-dialog-amount"
                hint={amount.hint ?? `Leave blank to use the full ${amount.max}.`}
              >
                <Input
                  id="reason-dialog-amount"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={amount.max}
                  step="0.01"
                  value={amountText}
                  invalid={amountInvalid}
                  onChange={(event) => setAmountText(event.target.value)}
                  placeholder={String(amount.max)}
                />
              </Field>
            )}

            <Field label={reasonLabel} htmlFor="reason-dialog-reason" required error={error ?? undefined}>
              <Textarea
                id="reason-dialog-reason"
                rows={4}
                value={reason}
                invalid={error !== null}
                onChange={(event) => setReason(event.target.value)}
                placeholder={placeholder}
              />
            </Field>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={variant} loading={pending}>
              {confirmLabel}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

/**
 * A confirm-only prompt, for an action with nothing to explain.
 *
 * Approving does not need a reason — the record itself is the evidence — but it
 * is still irreversible from this screen, so it still asks.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  variant = "primary",
  onConfirm,
  successMessage,
  pending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  variant?: "danger" | "primary" | "success";
  onConfirm: () => Promise<unknown>;
  successMessage: string;
  pending?: boolean;
}) {
  const [error, setError] = React.useState<string | null>(null);

  if (useValueChanged(open) && open) {
    setError(null);
  }

  async function confirm() {
    setError(null);

    try {
      await onConfirm();
      toast.success(successMessage);
      onOpenChange(false);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "That did not go through. Try again.",
      );
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {description !== undefined && <ModalDescription>{description}</ModalDescription>}
        </ModalHeader>

        {error !== null && (
          <ModalBody>
            <p className="text-sm font-medium text-danger">{error}</p>
          </ModalBody>
        )}

        <ModalFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={variant} loading={pending} onClick={() => void confirm()}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
