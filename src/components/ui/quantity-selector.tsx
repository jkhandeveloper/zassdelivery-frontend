"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface QuantitySelectorProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  /** Mid-mutation: keeps the control interactive-looking but inert. */
  pending?: boolean;
  size?: "sm" | "md";
  /**
   * Show a bin instead of a minus at the lower bound. The cart uses this —
   * PATCH /cart/items/:id with 0 removes the line, so the affordance should say so.
   */
  removeAtMin?: boolean;
  onRemove?: () => void;
  className?: string;
  /** Names the item, so the buttons are not five identical "Increase". */
  itemLabel?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  pending = false,
  size = "md",
  removeAtMin = false,
  onRemove,
  className,
  itemLabel,
}: QuantitySelectorProps) {
  const atMin = value <= min;
  const atMax = value >= max;
  const inert = disabled || pending;
  const suffix = itemLabel === undefined ? "" : ` ${itemLabel}`;

  const button =
    "grid place-items-center rounded-full text-primary transition-all duration-150 " +
    "hover:bg-surface hover:shadow-card disabled:opacity-35 disabled:hover:bg-transparent " +
    "disabled:hover:shadow-none active:scale-90 motion-reduce:active:scale-100";

  const dimensions = size === "sm" ? "size-7" : "size-9";

  const handleDecrement = () => {
    if (atMin && removeAtMin) {
      onRemove?.();
      return;
    }
    onChange(Math.max(min, value - 1));
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border-default bg-surface-muted p-1",
        pending && "animate-pulse",
        className,
      )}
    >
      <button
        type="button"
        className={cn(button, dimensions)}
        onClick={handleDecrement}
        disabled={inert || (atMin && !removeAtMin)}
        aria-label={atMin && removeAtMin ? `Remove${suffix}` : `Decrease quantity${suffix}`}
      >
        {atMin && removeAtMin ? (
          <Trash2 className="size-4 text-danger" />
        ) : (
          <Minus className="size-4" />
        )}
      </button>

      <span
        className={cn(
          "numeric min-w-8 text-center font-bold tabular-nums",
          size === "sm" ? "text-sm" : "text-base",
        )}
        aria-live="polite"
        aria-atomic
      >
        <span className="sr-only">Quantity{suffix}: </span>
        {value}
      </span>

      <button
        type="button"
        className={cn(button, dimensions)}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={inert || atMax}
        aria-label={`Increase quantity${suffix}`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
