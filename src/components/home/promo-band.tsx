"use client";

import { Clock3, Ticket, Truck, Wallet } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { useAvailableCoupons } from "@/hooks/use-coupons";
import { cn, formatPrice } from "@/lib/utils";
import type { CouponDto } from "@/types/admin";
import { CouponType } from "@/types/enums";

/**
 * The three tiles under the hero.
 *
 * Signed in, they are the customer's own live coupons — the real code, the real
 * threshold. Signed out there is nothing to personalise, so they state what the
 * product does instead of inventing a discount to advertise.
 */
function headline(coupon: CouponDto): string {
  switch (coupon.type) {
    case CouponType.PERCENTAGE:
      return `Flat ${coupon.value}% off`;
    case CouponType.FIXED_AMOUNT:
      return `${formatPrice(coupon.value)} off`;
    case CouponType.FREE_DELIVERY:
      return "Free delivery";
    default:
      return "Discount";
  }
}

/** Each tile is washed in its own tone, so three of them do not read as one slab. */
const TONES = {
  warm: {
    wash: "bg-[color-mix(in_srgb,var(--secondary)_9%,var(--surface))]",
    icon: "bg-accent-warm-soft text-accent-warm",
  },
  brand: {
    wash: "bg-[color-mix(in_srgb,var(--brand)_9%,var(--surface))]",
    icon: "bg-brand-soft text-brand",
  },
  gold: {
    wash: "bg-[color-mix(in_srgb,var(--accent)_11%,var(--surface))]",
    icon: "bg-accent-gold-soft text-accent-gold",
  },
} as const;

function Tile({
  icon,
  title,
  body,
  footer,
  href,
  tone,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  footer?: ReactNode;
  href: string;
  tone: keyof typeof TONES;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 rounded-[var(--radius-card)] border border-border-subtle p-5 shadow-card",
        "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-1 hover:border-brand/40 hover:shadow-glow",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        "motion-reduce:transform-none motion-reduce:transition-none",
        TONES[tone].wash,
      )}
    >
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", TONES[tone].icon)}>
        {icon}
      </span>

      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-display text-lg font-extrabold leading-tight text-primary">
          {title}
        </span>
        <span className="text-sm text-secondary">{body}</span>
        {footer}
      </span>
    </Link>
  );
}

export function PromoBand() {
  const { isAuthenticated, isReady } = useAuth();
  const { data, isPending } = useAvailableCoupons({ limit: 10 }, isReady && isAuthenticated);

  if (isReady && isAuthenticated && isPending) {
    return (
      <SkeletonRegion label="Loading your offers" className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-[var(--radius-card)]" />
        ))}
      </SkeletonRegion>
    );
  }

  const live = (data?.items ?? []).filter((coupon) => coupon.isLive).slice(0, 3);

  if (live.length > 0) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {live.map((coupon) => (
          <Tile
            key={coupon.id}
            tone={coupon.type === CouponType.FREE_DELIVERY ? "brand" : "warm"}
            href="/offers"
            icon={
              coupon.type === CouponType.FREE_DELIVERY ? (
                <Truck className="size-6" />
              ) : (
                <Ticket className="size-6" />
              )
            }
            title={headline(coupon)}
            body={
              coupon.minOrderAmount > 0
                ? `On orders above ${formatPrice(coupon.minOrderAmount)}`
                : (coupon.description ?? "On your next order")
            }
            footer={
              <span className="mt-1 w-fit rounded-full bg-surface-muted px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-primary">
                {coupon.code}
              </span>
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Tile
        tone="warm"
        href="/offers"
        icon={<Ticket className="size-6" />}
        title="Deals worth ordering"
        body="Every coupon on your account, in one place."
      />
      <Tile
        tone="brand"
        href="/restaurants"
        icon={<Clock3 className="size-6" />}
        title="Live prep times"
        body="Each kitchen's own estimate, before you order."
      />
      <Tile
        tone="gold"
        href="/restaurants"
        icon={<Wallet className="size-6" />}
        title="Pay how you like"
        body="Cash on delivery, card, JazzCash or Easypaisa."
      />
    </div>
  );
}
