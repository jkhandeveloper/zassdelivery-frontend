"use client";

import type { ReactNode } from "react";

import { cn, formatPrice } from "@/lib/utils";
import type { CartTotalsDto } from "@/types/cart";

/**
 * The money block, shared by the cart, checkout and the restaurant's order
 * panel. Every figure is the server's — nothing here is added up on the client,
 * so the total on screen is always the total that will be charged.
 */
function Row({
  label,
  value,
  tone = "default",
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: "default" | "discount" | "muted";
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className={cn(tone === "muted" ? "text-muted" : "text-secondary")}>{label}</span>
      <span
        className={cn(
          "numeric font-semibold",
          tone === "discount" ? "text-success" : "text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function OrderSummary({
  totals,
  freeDeliveryReason,
  className,
  children,
}: {
  totals: CartTotalsDto;
  freeDeliveryReason?: string | null;
  className?: string;
  /** Buttons or notes that belong under the total. */
  children?: ReactNode;
}) {
  const saved = totals.discountAmount;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Row label="Subtotal" value={formatPrice(totals.subtotal)} />

      {saved > 0 && (
        <Row label="Discount" value={`− ${formatPrice(saved)}`} tone="discount" />
      )}

      <Row
        label="Delivery fee"
        value={
          totals.deliveryFee === 0 ? (
            <span className="text-success">Free</span>
          ) : (
            formatPrice(totals.deliveryFee)
          )
        }
      />

      {totals.serviceFee > 0 && (
        <Row label="Service fee" value={formatPrice(totals.serviceFee)} />
      )}
      {totals.taxAmount > 0 && <Row label="Tax" value={formatPrice(totals.taxAmount)} />}
      {totals.tipAmount > 0 && <Row label="Rider tip" value={formatPrice(totals.tipAmount)} />}

      {freeDeliveryReason !== null && freeDeliveryReason !== undefined && freeDeliveryReason !== "" && (
        <p className="rounded-lg bg-success-soft px-3 py-2 text-xs font-semibold text-success">
          {freeDeliveryReason}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-border-subtle pt-3">
        <span className="font-display text-base font-extrabold text-primary">Total</span>
        <span className="numeric font-display text-xl font-extrabold text-brand">
          {formatPrice(totals.totalAmount)}
        </span>
      </div>

      {saved > 0 && (
        <p className="rounded-lg bg-success-soft px-3 py-2 text-center text-sm font-bold text-success">
          You saved {formatPrice(saved)}
        </p>
      )}

      {children}
    </div>
  );
}
