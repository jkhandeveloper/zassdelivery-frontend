"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";
import type { UserStatus } from "@/types/auth";
import type {
  AssignmentStatus,
  DriverAvailability,
  DriverDocumentStatus,
  DriverStatus,
  MenuItemStatus,
  OrderStatus,
  PaymentStatus,
  PayoutStatus,
  RestaurantStatus,
  TicketPriority,
  TicketStatus,
  TransactionStatus,
} from "@/types/enums";

/**
 * One pill for every lifecycle in the product (§4).
 *
 * Orders, payments, withdrawals, restaurants, riders and tickets all share this
 * component and this map. A second colour vocabulary is how "pending" ends up
 * amber on one screen and grey on the next.
 */

// `w-fit` because an inline-flex span still stretches as a flex *item*, which
// is how a status pill ends up spanning a whole column.
const pillVariants = cva(
  "inline-flex w-fit items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-surface-sunken text-secondary",
        info: "bg-brand-soft text-brand",
        pending: "bg-warning-soft text-warning",
        progress: "bg-accent-warm-soft text-accent-warm",
        success: "bg-success-soft text-success",
        danger: "bg-danger-soft text-danger",
      },
      size: {
        sm: "px-2.5 py-0.5 text-xs",
        md: "px-3 py-1 text-[0.8125rem]",
        lg: "px-3.5 py-1.5 text-sm",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export type StatusTone = NonNullable<VariantProps<typeof pillVariants>["tone"]>;

/** Every status string the API can hand us, in one union. */
export type AnyStatus =
  | OrderStatus
  | PaymentStatus
  | PayoutStatus
  | RestaurantStatus
  | DriverStatus
  | DriverAvailability
  | DriverDocumentStatus
  | AssignmentStatus
  | MenuItemStatus
  | TicketStatus
  | TicketPriority
  | TransactionStatus
  | UserStatus;

interface StatusMeta {
  tone: StatusTone;
  label: string;
}

/**
 * status → tone + human label.
 *
 * Several enums share member names (PENDING, ACTIVE, REJECTED…), and that is
 * fine: a rejected restaurant and a rejected payout should read the same.
 */
const STATUS_MAP: Record<string, StatusMeta> = {
  // ── Orders ──
  PENDING_PAYMENT: { tone: "pending", label: "Awaiting payment" },
  PLACED: { tone: "info", label: "Placed" },
  CONFIRMED: { tone: "info", label: "Confirmed" },
  PREPARING: { tone: "progress", label: "Preparing" },
  READY_FOR_PICKUP: { tone: "progress", label: "Ready for pickup" },
  PICKED_UP: { tone: "progress", label: "Picked up" },
  ON_THE_WAY: { tone: "progress", label: "On the way" },
  DELIVERED: { tone: "success", label: "Delivered" },
  CANCELLED: { tone: "danger", label: "Cancelled" },
  FAILED: { tone: "danger", label: "Failed" },

  // ── Payments & payouts ──
  PENDING: { tone: "pending", label: "Pending" },
  AUTHORIZED: { tone: "info", label: "Authorised" },
  PAID: { tone: "success", label: "Paid" },
  REFUNDED: { tone: "neutral", label: "Refunded" },
  PARTIALLY_REFUNDED: { tone: "neutral", label: "Partially refunded" },
  APPROVED: { tone: "info", label: "Approved" },
  SUCCESS: { tone: "success", label: "Successful" },
  REVERSED: { tone: "neutral", label: "Reversed" },

  // ── Approval lifecycles (restaurants, riders, documents) ──
  PENDING_APPROVAL: { tone: "pending", label: "Pending approval" },
  ACTIVE: { tone: "success", label: "Active" },
  SUSPENDED: { tone: "danger", label: "Suspended" },
  TEMPORARILY_CLOSED: { tone: "neutral", label: "Temporarily closed" },
  REJECTED: { tone: "danger", label: "Rejected" },
  VERIFIED: { tone: "success", label: "Verified" },
  PENDING_VERIFICATION: { tone: "pending", label: "Pending verification" },
  BANNED: { tone: "danger", label: "Banned" },

  // ── Rider availability ──
  OFFLINE: { tone: "neutral", label: "Offline" },
  ONLINE: { tone: "success", label: "Online" },
  ON_DELIVERY: { tone: "progress", label: "On delivery" },
  ON_BREAK: { tone: "pending", label: "On break" },

  // ── Delivery assignments ──
  OFFERED: { tone: "pending", label: "Offered" },
  ACCEPTED: { tone: "info", label: "Accepted" },
  EXPIRED: { tone: "neutral", label: "Expired" },
  COMPLETED: { tone: "success", label: "Completed" },

  // ── Menu items ──
  AVAILABLE: { tone: "success", label: "Available" },
  OUT_OF_STOCK: { tone: "danger", label: "Out of stock" },
  HIDDEN: { tone: "neutral", label: "Hidden" },

  // ── Support tickets ──
  OPEN: { tone: "info", label: "Open" },
  IN_PROGRESS: { tone: "progress", label: "In progress" },
  WAITING_ON_CUSTOMER: { tone: "pending", label: "Waiting on customer" },
  RESOLVED: { tone: "success", label: "Resolved" },
  CLOSED: { tone: "neutral", label: "Closed" },

  // ── Ticket priority ──
  LOW: { tone: "neutral", label: "Low" },
  MEDIUM: { tone: "info", label: "Medium" },
  HIGH: { tone: "pending", label: "High" },
  URGENT: { tone: "danger", label: "Urgent" },
};

/** Turns SCREAMING_SNAKE into Sentence case, for a status we have not mapped. */
function humanise(status: string): string {
  const words = status.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function statusMeta(status: string): StatusMeta {
  return STATUS_MAP[status] ?? { tone: "neutral", label: humanise(status) };
}

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Pick<VariantProps<typeof pillVariants>, "size"> {
  status: AnyStatus | (string & {});
  /** Overrides the mapped label — e.g. the API's own `statusText`. */
  label?: string;
  /** A filled dot in the pill's tone, for dense lists and kanban columns. */
  withDot?: boolean;
}

export function StatusPill({
  status,
  label,
  size,
  withDot = false,
  className,
  ...props
}: StatusPillProps) {
  const meta = statusMeta(status);

  return (
    <span className={cn(pillVariants({ tone: meta.tone, size }), className)} {...props}>
      {withDot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {label ?? meta.label}
    </span>
  );
}

// ── Badge ────────────────────────────────────────────────────

const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        solid: "gradient-brand text-white",
        soft: "bg-brand-soft text-brand",
        outline: "border border-border-strong text-secondary",
        gold: "bg-accent-gold-soft text-accent-gold",
        dark: "bg-surface-inverse text-inverse",
      },
      size: {
        sm: "px-2.5 py-0.5 text-xs",
        md: "px-3 py-1 text-[0.8125rem]",
      },
    },
    defaultVariants: { variant: "soft", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
