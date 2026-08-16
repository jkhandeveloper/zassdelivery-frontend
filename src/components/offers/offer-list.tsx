"use client";

import { Check, Copy, Ticket } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Badge } from "@/components/ui/status-pill";
import { useAvailableCoupons } from "@/hooks/use-coupons";
import { cn, formatPrice } from "@/lib/utils";
import { CouponType } from "@/types/enums";
import type { CouponDto } from "@/types/admin";

/** The headline number, phrased the way the discount actually applies. */
function offerHeadline(coupon: CouponDto): string {
  switch (coupon.type) {
    case CouponType.PERCENTAGE:
      return `${coupon.value}% off`;
    case CouponType.FIXED_AMOUNT:
      return `${formatPrice(coupon.value)} off`;
    case CouponType.FREE_DELIVERY:
      return "Free delivery";
    default:
      return "Discount";
  }
}

function daysLeft(expiresAt: string): number | null {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;
  return Math.ceil(ms / 86_400_000);
}

function CouponCard({ coupon }: { coupon: CouponDto }) {
  const [copied, setCopied] = React.useState(false);
  const remaining = daysLeft(coupon.expiresAt);

  // Reset the "Copied" confirmation without leaving a timer behind on unmount.
  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
    } catch {
      // Clipboard is blocked without a secure context or permission; the code
      // is on screen and selectable, so there is nothing to recover from.
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <div
        aria-hidden
        className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand"
      >
        <Ticket className="size-6" />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-extrabold text-primary">{offerHeadline(coupon)}</h2>
          {coupon.firstOrderOnly && <Badge variant="soft">First order only</Badge>}
          {remaining !== null && remaining <= 7 && (
            <Badge variant="outline">{remaining === 1 ? "Ends today" : `${remaining} days left`}</Badge>
          )}
        </div>

        {coupon.description !== null && coupon.description !== "" && (
          <p className="text-sm text-secondary">{coupon.description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5 text-sm text-muted">
          {coupon.minOrderAmount > 0 && (
            <span className="numeric">Min order {formatPrice(coupon.minOrderAmount)}</span>
          )}
          {coupon.maxDiscountAmount !== null && (
            <span className="numeric">Up to {formatPrice(coupon.maxDiscountAmount)}</span>
          )}
          {coupon.remainingUses !== null && coupon.remainingUses <= 20 && (
            <span className="numeric">Only {coupon.remainingUses} left</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
        <code
          className={cn(
            "rounded-[var(--radius-input)] border border-dashed border-border-strong",
            "bg-surface-muted px-3 py-2 font-mono text-sm font-bold tracking-wider text-primary",
          )}
        >
          {coupon.code}
        </code>
        <Button variant="outline" size="sm" onClick={() => void copy()}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </Card>
  );
}

export function OfferList() {
  const { isAuthenticated, isReady } = useAuth();

  // The endpoint scopes offers to the caller, so there is nothing to ask for
  // until we know someone is signed in.
  const { data, isPending, isError, error, refetch } = useAvailableCoupons(
    { limit: 50 },
    isReady && isAuthenticated,
  );

  if (isReady && !isAuthenticated) {
    return (
      <EmptyState
        icon={<Ticket className="size-8" />}
        title="Sign in to see your offers"
        description="Coupons depend on your account — which ones you have already used, and whether this would be your first order."
        action={
          <Button asChild>
            <Link href="/login?next=%2Foffers">Sign in</Link>
          </Button>
        }
      />
    );
  }

  if (!isReady || isPending) {
    return <ListSkeleton />;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  // isLive is the server's own verdict on "usable right now" — honour it rather
  // than recomputing the date window here and risking a different answer.
  const live = data.items.filter((coupon) => coupon.isLive);

  if (live.length === 0) {
    return (
      <EmptyState
        icon={<Ticket className="size-8" />}
        title="No offers right now"
        description="There are no coupons available on your account today. New ones appear here as they launch."
        action={
          <Button variant="outline" asChild>
            <Link href="/restaurants">Browse restaurants</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {live.map((coupon) => (
        <CouponCard key={coupon.id} coupon={coupon} />
      ))}
    </div>
  );
}
