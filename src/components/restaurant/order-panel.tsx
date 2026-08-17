"use client";

import { Clock, MapPin, ShoppingBag, Star, Store } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/providers/auth-provider";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { useAddresses } from "@/hooks/use-users";
import { isFilledCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import type { RestaurantDto } from "@/types/restaurant";

/**
 * The right rail on a restaurant page: where the order is going, whether the
 * kitchen can take it, and what is in the basket so far.
 *
 * The basket half only appears when the live cart belongs to *this* restaurant
 * — the cart is single-kitchen, and showing someone else's items here would
 * suggest they could be checked out from this page.
 */
export function RestaurantOrderPanel({ restaurant }: { restaurant: RestaurantDto }) {
  const { isAuthenticated, isReady } = useAuth();
  const signedIn = isReady && isAuthenticated;

  const cart = useCart(signedIn);
  const addresses = useAddresses({ limit: 20 }, signedIn);

  // Kept as its own binding so the narrowing survives into the JSX below.
  const liveCart = isFilledCart(cart.data) ? cart.data : null;
  const forThisRestaurant = liveCart !== null && liveCart.restaurant.id === restaurant.id;

  const items = addresses.data?.items ?? [];
  const preferred = items.find((address) => address.isDefault) ?? items[0];

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-5 shadow-card">
      <h2 className="font-display text-lg font-extrabold text-primary">Your order</h2>

      {/* ── Where and when ───────────────────────────────── */}
      <dl className="flex flex-col gap-3.5 text-sm">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <MapPin aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Deliver to
            </dt>
            <dd className="truncate font-semibold text-primary">
              {!signedIn ? (
                <Link href="/login?next=%2Fprofile" className="text-brand hover:underline">
                  Sign in to set an address
                </Link>
              ) : addresses.isPending ? (
                <Skeleton className="mt-1 h-4 w-32" />
              ) : preferred === undefined ? (
                <Link href="/profile#addresses" className="text-brand hover:underline">
                  Add a delivery address
                </Link>
              ) : (
                preferred.line1
              )}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <Store aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Kitchen</dt>
            <dd className="font-semibold text-primary">
              {restaurant.canOrderNow
                ? "Open and taking orders"
                : restaurant.isOpenNow
                  ? "Open, but paused"
                  : typeof restaurant.opensInMinutes === "number" && restaurant.opensInMinutes > 0
                    ? `Opens in ${restaurant.opensInMinutes} min`
                    : "Closed right now"}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <Clock aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Preparation
            </dt>
            <dd className="numeric font-semibold text-primary">
              About {restaurant.avgPreparationMinutes} min
            </dd>
          </div>
        </div>

        {restaurant.ratingCount > 0 && (
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-gold-soft text-accent-gold">
              <Star aria-hidden className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Rating</dt>
              <dd className="numeric font-semibold text-primary">
                {restaurant.rating.toFixed(1)}{" "}
                <span className="font-normal text-muted">({restaurant.ratingCount})</span>
              </dd>
            </div>
          </div>
        )}

        {restaurant.minOrderAmount > 0 && (
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-warm-soft text-accent-warm">
              <ShoppingBag aria-hidden className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                Minimum order
              </dt>
              <dd className="numeric font-semibold text-primary">
                {formatPrice(restaurant.minOrderAmount)}
              </dd>
            </div>
          </div>
        )}
      </dl>

      {/* ── The basket, when it is this kitchen's ─────────── */}
      {forThisRestaurant && liveCart !== null ? (
        <div className="flex flex-col gap-4 border-t border-border-subtle pt-4">
          <ul className="flex max-h-64 flex-col gap-3 overflow-y-auto">
            {liveCart.items.map((line) => (
              <li key={line.id} className="flex items-center gap-3">
                <span className="size-11 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                  <Media src={line.imageUrl} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-primary">{line.name}</span>
                  <span className="numeric block text-xs text-muted">
                    {line.quantity} ×{" "}
                    {formatPrice(line.unitPrice + line.addOnsTotal)}
                  </span>
                </span>
                <span className="numeric shrink-0 text-sm font-bold text-primary">
                  {formatPrice(line.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <OrderSummary
            totals={liveCart.totals}
            freeDeliveryReason={liveCart.totals.freeDeliveryReason}
            className="border-t border-border-subtle pt-4"
          >
            <Button block size="lg" asChild>
              <Link href="/cart">Review your cart</Link>
            </Button>
          </OrderSummary>
        </div>
      ) : (
        <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
          <p className="text-sm text-secondary">
            {!signedIn
              ? "Sign in to start an order from this kitchen."
              : liveCart !== null
                ? "Your cart has items from another restaurant. Empty it first to order from here."
                : "Nothing added yet — pick something from the menu and it will show up here."}
          </p>

          {!signedIn && (
            <Button block asChild>
              <Link href={`/login?next=/restaurants/${restaurant.slug}`}>Sign in</Link>
            </Button>
          )}
          {signedIn && liveCart !== null && (
            <Button block variant="outline" asChild>
              <Link href="/cart">Go to your cart</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
