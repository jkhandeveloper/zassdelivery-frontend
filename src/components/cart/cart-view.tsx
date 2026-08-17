"use client";

import { AlertTriangle, ArrowRight, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { OrderSummary } from "@/components/cart/order-summary";
import { PopularRail } from "@/components/home/popular-rail";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Media } from "@/components/ui/media";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { CartRowSkeleton, Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import {
  useApplyCoupon,
  useCart,
  useClearCart,
  useRemoveCartItem,
  useRemoveCoupon,
  useUpdateCartItem,
} from "@/hooks/use-cart";
import { ApiError } from "@/lib/api-client";
import { isFilledCart } from "@/lib/cart";
import { cn, formatPrice } from "@/lib/utils";
import type { CartLineDto } from "@/types/cart";

/**
 * One line in the cart.
 *
 * The mutations are keyed by item id, so each row owns its own — a row that is
 * saving must not put every other row into a pending state.
 */
function CartRow({ line }: { line: CartLineDto }) {
  const update = useUpdateCartItem(line.id);
  const remove = useRemoveCartItem(line.id);

  const failed = (error: unknown) => {
    toast.error(
      error instanceof ApiError ? error.message : "We couldn't update your cart. Please try again.",
    );
  };

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-4 border-b border-border-subtle py-4 last:border-0",
        !line.isAvailable && "opacity-60",
      )}
    >
      <span className="size-20 shrink-0 overflow-hidden rounded-2xl bg-surface-muted">
        <Media src={line.imageUrl} />
      </span>

      <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
        <p className="font-display text-[0.9375rem] font-extrabold text-primary">{line.name}</p>

        {line.variantName !== null && line.variantName !== "" && (
          <p className="text-xs text-muted">{line.variantName}</p>
        )}

        {line.addOns.length > 0 && (
          <p className="text-xs text-muted">
            {line.addOns.map((addOn) => addOn.name).join(", ")}
          </p>
        )}

        {line.notes !== null && line.notes !== "" && (
          <p className="text-xs italic text-secondary">“{line.notes}”</p>
        )}

        {!line.isAvailable && (
          <p className="text-xs font-semibold text-danger">
            Unavailable right now — remove it to check out.
          </p>
        )}
      </div>

      <span className="numeric w-24 shrink-0 text-sm font-semibold text-secondary">
        {formatPrice(line.unitPrice + line.addOnsTotal)}
      </span>

      <QuantitySelector
        value={line.quantity}
        size="sm"
        itemLabel={line.name}
        pending={update.isPending || remove.isPending}
        removeAtMin
        onRemove={() => remove.mutate(undefined, { onError: failed })}
        onChange={(next) => update.mutate({ quantity: next }, { onError: failed })}
      />

      <span className="numeric w-24 shrink-0 text-right font-display font-extrabold text-primary">
        {formatPrice(line.lineTotal)}
      </span>

      <button
        type="button"
        onClick={() => remove.mutate(undefined, { onError: failed })}
        aria-label={`Remove ${line.name}`}
        className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-danger-soft hover:text-danger"
      >
        <X className="size-4" />
      </button>
    </li>
  );
}

/** Promo code entry — the API decides whether a code applies, never this box. */
function CouponBox({ appliedCode }: { appliedCode: string | null }) {
  const [code, setCode] = React.useState("");
  const apply = useApplyCoupon();
  const remove = useRemoveCoupon();

  if (appliedCode !== null && appliedCode !== "") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[var(--radius-input)] border border-dashed border-success bg-success-soft px-3.5 py-2.5">
        <span className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-success">
          <Tag aria-hidden className="size-4 shrink-0" />
          <span className="truncate font-mono tracking-wider">{appliedCode}</span>
        </span>
        <button
          type="button"
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: () => toast.success("Coupon removed"),
              onError: () => toast.error("We couldn't remove that coupon."),
            })
          }
          disabled={remove.isPending}
          className="shrink-0 text-xs font-bold text-secondary underline-offset-2 hover:underline"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = code.trim();
        if (trimmed === "") return;

        apply.mutate(
          { code: trimmed },
          {
            onSuccess: () => {
              toast.success("Coupon applied");
              setCode("");
            },
            onError: (error) =>
              toast.error(
                error instanceof ApiError ? error.message : "That code didn't work.",
              ),
          },
        );
      }}
      className="flex gap-2"
    >
      <label htmlFor="promo-code" className="sr-only">
        Promo code
      </label>
      <Input
        id="promo-code"
        value={code}
        onChange={(event) => setCode(event.target.value.toUpperCase())}
        placeholder="Enter promo code"
        className="h-11 font-mono tracking-wider"
      />
      <Button type="submit" variant="outline" loading={apply.isPending} className="h-11 shrink-0">
        Apply
      </Button>
    </form>
  );
}

export function CartView() {
  const { isAuthenticated, isReady } = useAuth();
  const signedIn = isReady && isAuthenticated;

  const cart = useCart(signedIn);
  const clear = useClearCart();

  if (isReady && !isAuthenticated) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-8" />}
        title="Sign in to see your cart"
        description="Your cart follows your account, so it is waiting for you on every device."
        action={
          <Button asChild>
            <Link href="/login?next=%2Fcart">Sign in</Link>
          </Button>
        }
      />
    );
  }

  if (!isReady || cart.isPending) {
    return (
      <SkeletonRegion label="Loading your cart" className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-2 rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-6">
          {Array.from({ length: 3 }, (_, index) => (
            <CartRowSkeleton key={index} />
          ))}
        </div>
        <Skeleton className="h-80 rounded-[var(--radius-panel)]" />
      </SkeletonRegion>
    );
  }

  if (cart.isError) {
    return <ErrorState error={cart.error} onRetry={() => void cart.refetch()} />;
  }

  const liveCart = isFilledCart(cart.data) ? cart.data : null;

  if (liveCart === null) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-8" />}
        title="Your cart is empty"
        description="Find a kitchen you like and your picks will collect here."
        action={
          <Button asChild>
            <Link href="/restaurants">Browse restaurants</Link>
          </Button>
        }
      />
    );
  }

  const blocking = liveCart.issues.filter((issue) => issue.blocking);
  const advisory = liveCart.issues.filter((issue) => !issue.blocking);

  return (
    <div className="flex flex-col gap-14">
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
        <section className="flex min-w-0 flex-col gap-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-5 shadow-card sm:p-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="size-11 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                <Media src={liveCart.restaurant.logoUrl} variant="store" />
              </span>
              <div className="flex flex-col">
                <h2 className="font-display text-lg font-extrabold text-primary">
                  <Link
                    href={`/restaurants/${liveCart.restaurant.slug}`}
                    className="hover:text-brand"
                  >
                    {liveCart.restaurant.name}
                  </Link>
                </h2>
                <p className="numeric text-sm text-muted">
                  {liveCart.totals.totalQuantity}{" "}
                  {liveCart.totals.totalQuantity === 1 ? "item" : "items"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                clear.mutate(undefined, {
                  onSuccess: () => toast.success("Cart emptied"),
                  onError: () => toast.error("We couldn't empty your cart."),
                })
              }
              disabled={clear.isPending}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
            >
              <Trash2 aria-hidden className="size-4" />
              Clear cart
            </button>
          </header>

          {(blocking.length > 0 || advisory.length > 0) && (
            <ul className="flex flex-col gap-2">
              {[...blocking, ...advisory].map((issue) => (
                <li
                  key={`${issue.code}-${issue.cartItemId ?? "cart"}`}
                  className={cn(
                    "flex items-start gap-2 rounded-[var(--radius-input)] px-3.5 py-2.5 text-sm font-medium",
                    issue.blocking
                      ? "bg-danger-soft text-danger"
                      : "bg-warning-soft text-warning",
                  )}
                >
                  <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {issue.message}
                </li>
              ))}
            </ul>
          )}

          <ul className="flex flex-col">
            {liveCart.items.map((line) => (
              <CartRow key={line.id} line={line} />
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-5 shadow-card lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-extrabold text-primary">Order summary</h2>

          <CouponBox appliedCode={liveCart.couponCode} />

          <OrderSummary
            totals={liveCart.totals}
            freeDeliveryReason={liveCart.totals.freeDeliveryReason}
          >
            <Button
              block
              size="lg"
              variant="neon"
              disabled={!liveCart.canCheckout}
              asChild={liveCart.canCheckout}
            >
              {liveCart.canCheckout ? (
                <Link href="/checkout">
                  Proceed to checkout
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              ) : (
                <span>Resolve the issues above</span>
              )}
            </Button>

            <Button block variant="ghost" asChild>
              <Link href={`/restaurants/${liveCart.restaurant.slug}`}>Add more items</Link>
            </Button>
          </OrderSummary>
        </aside>
      </div>

      <PopularRail title="You may also like" />
    </div>
  );
}
