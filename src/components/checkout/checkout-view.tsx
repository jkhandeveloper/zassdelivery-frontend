"use client";

import {
  Banknote,
  CreditCard,
  Home,
  Loader2,
  Lock,
  MapPin,
  Plus,
  ShoppingBag,
  Smartphone,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { NewAddressForm } from "@/components/account/address-form";
import { OrderSummary } from "@/components/cart/order-summary";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { Media } from "@/components/ui/media";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useCart, usePlaceOrder, useSetDeliveryAddress } from "@/hooks/use-cart";
import { usePaymentMethods, useStartCheckout } from "@/hooks/use-payments";
import { useAddresses } from "@/hooks/use-users";
import { ApiError } from "@/lib/api-client";
import { isFilledCart } from "@/lib/cart";
import { cn, formatLandmark, formatPrice, hasText } from "@/lib/utils";
import { PaymentMethod } from "@/types/enums";
import type { AddressDto } from "@/types/user";

/** An icon per gateway, so the list is scannable rather than four identical rows. */
const METHOD_ICONS: Record<string, React.ReactNode> = {
  [PaymentMethod.CASH_ON_DELIVERY]: <Banknote className="size-5" />,
  [PaymentMethod.CARD]: <CreditCard className="size-5" />,
  [PaymentMethod.JAZZCASH]: <Smartphone className="size-5" />,
  [PaymentMethod.EASYPAISA]: <Smartphone className="size-5" />,
  [PaymentMethod.WALLET]: <Wallet className="size-5" />,
  [PaymentMethod.BANK_TRANSFER]: <Banknote className="size-5" />,
};

/** The API names gateways in lowercase ("cash", "jazzcash"); these are for people. */
const METHOD_LABELS: Record<string, string> = {
  [PaymentMethod.CASH_ON_DELIVERY]: "Cash on delivery",
  [PaymentMethod.CARD]: "Credit or debit card",
  [PaymentMethod.JAZZCASH]: "JazzCash",
  [PaymentMethod.EASYPAISA]: "Easypaisa",
  [PaymentMethod.WALLET]: "ZassDelivery wallet",
  [PaymentMethod.BANK_TRANSFER]: "Bank transfer",
};

const METHOD_HINTS: Record<string, string> = {
  [PaymentMethod.CASH_ON_DELIVERY]: "Pay the rider when your order arrives",
  [PaymentMethod.CARD]: "You'll be taken to the payment page",
  [PaymentMethod.JAZZCASH]: "You'll be taken to JazzCash to confirm",
  [PaymentMethod.EASYPAISA]: "You'll be taken to Easypaisa to confirm",
  [PaymentMethod.WALLET]: "Paid from your ZassDelivery balance",
  [PaymentMethod.BANK_TRANSFER]: "Transfer the total from your bank",
};

function Panel({
  title,
  step,
  children,
  className,
}: {
  title: string;
  step: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-5 shadow-card sm:p-6",
        className,
      )}
    >
      <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-primary">
        <span className="numeric grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-sm text-brand">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function AddressRow({
  address,
  selected,
  onSelect,
  pending,
}: {
  address: AddressDto;
  selected: boolean;
  onSelect: () => void;
  pending: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-[var(--radius-input)] border p-3.5 transition-colors",
        "focus-within:ring-4 focus-within:ring-[var(--brand-ring)]",
        selected
          ? "border-brand bg-brand-soft"
          : "border-border-default bg-surface-muted hover:border-brand",
        pending && "animate-pulse",
      )}
    >
      <input
        type="radio"
        name="address"
        className="sr-only"
        checked={selected}
        onChange={onSelect}
      />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2",
          selected ? "border-brand" : "border-border-strong",
        )}
      >
        {selected && <span className="size-2 rounded-full bg-brand" />}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-sm font-bold text-primary">
          {address.label === "HOME" ? (
            <Home aria-hidden className="size-3.5" />
          ) : (
            <MapPin aria-hidden className="size-3.5" />
          )}
          {address.label === null ? "Address" : address.label.toLowerCase()}
          {address.isDefault && (
            <span className="rounded-full bg-surface px-2 py-0.5 text-[0.6875rem] font-bold text-secondary">
              Default
            </span>
          )}
        </span>
        <span className="text-sm text-secondary">{address.line1}</span>
        {hasText(address.landmark) && (
          <span className="text-xs text-muted">{formatLandmark(address.landmark)}</span>
        )}
        {!address.isDeliverable && (
          <span className="text-xs font-semibold text-danger">
            Outside the delivery area for this restaurant.
          </span>
        )}
      </span>
    </label>
  );
}

export function CheckoutView() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();
  const signedIn = isReady && isAuthenticated;

  const cart = useCart(signedIn);
  const addresses = useAddresses({ limit: 20 }, signedIn);
  const methods = usePaymentMethods(signedIn);

  const setAddress = useSetDeliveryAddress();
  const placeOrder = usePlaceOrder();
  const startCheckout = useStartCheckout();

  const [method, setMethod] = React.useState<PaymentMethod>(PaymentMethod.CASH_ON_DELIVERY);
  const [note, setNote] = React.useState("");
  const [addingAddress, setAddingAddress] = React.useState(false);

  const liveCart = isFilledCart(cart.data) ? cart.data : null;
  const addressList = React.useMemo(() => addresses.data?.items ?? [], [addresses.data]);
  const selectedAddressId = liveCart?.delivery.addressId ?? null;

  // An empty delivery block on a cart whose owner already has a default address
  // is a dead end, so the default is sent for them — once. The ref is what keeps
  // "once" true: the mutation object is new on every render, so a guard on its
  // pending flag alone would fire again before the first call lands.
  const autoSelected = React.useRef(false);

  React.useEffect(() => {
    if (autoSelected.current) return;
    if (liveCart === null || selectedAddressId !== null || addressList.length === 0) return;

    autoSelected.current = true;
    const preferred = addressList.find((address) => address.isDefault) ?? addressList[0];
    setAddress.mutate({ addressId: preferred.id });
  }, [addressList, liveCart, selectedAddressId, setAddress]);

  if (isReady && !isAuthenticated) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-8" />}
        title="Sign in to check out"
        description="Your cart, addresses and payment options all live on your account."
        action={
          <Button asChild>
            <Link href="/login?next=%2Fcheckout">Sign in</Link>
          </Button>
        }
      />
    );
  }

  if (!isReady || cart.isPending) {
    return (
      <SkeletonRegion label="Loading checkout" className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-96 rounded-[var(--radius-panel)]" />
        ))}
      </SkeletonRegion>
    );
  }

  if (cart.isError) {
    return <ErrorState error={cart.error} onRetry={() => void cart.refetch()} />;
  }

  if (liveCart === null) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-8" />}
        title="There's nothing to check out"
        description="Your cart is empty — pick a kitchen and add something first."
        action={
          <Button asChild>
            <Link href="/restaurants">Browse restaurants</Link>
          </Button>
        }
      />
    );
  }

  const available = (methods.data ?? []).filter((gateway) => gateway.available);
  const blocking = liveCart.issues.filter((issue) => issue.blocking);
  const canPlace =
    liveCart.canCheckout && blocking.length === 0 && selectedAddressId !== null;

  const submit = async () => {
    try {
      const order = await placeOrder.mutateAsync({
        paymentMethod: method,
        ...(note.trim() !== "" && { customerNote: note.trim() }),
      });

      // Cash needs no gateway hop; everything else is settled by the API's own
      // checkout call, which decides whether a redirect is involved.
      if (method !== PaymentMethod.CASH_ON_DELIVERY) {
        const checkout = await startCheckout.mutateAsync({
          orderId: order.id,
          data: { method },
        });

        const redirectUrl = checkout.checkout?.redirectUrl;
        if (checkout.action === "REDIRECT" && redirectUrl !== undefined && redirectUrl !== "") {
          window.location.assign(redirectUrl);
          return;
        }

        toast.success(checkout.message);
      } else {
        toast.success(`Order ${order.orderNumber} placed`);
      }

      router.push("/orders");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "We couldn't place your order. Please try again.",
      );
    }
  };

  const working = placeOrder.isPending || startCheckout.isPending;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {/* ── 1. Where it goes ─────────────────────────────── */}
      <Panel title="Delivery information" step={1}>
        {addresses.isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }, (_, index) => (
              <Skeleton key={index} className="h-20 rounded-[var(--radius-input)]" />
            ))}
          </div>
        ) : addressList.length === 0 && !addingAddress ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-secondary">
              You haven&apos;t saved an address yet. Add one so the rider knows where to go.
            </p>
            <Button variant="outline" onClick={() => setAddingAddress(true)}>
              <Plus className="size-4" />
              Add an address
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {addressList.map((address) => (
              <AddressRow
                key={address.id}
                address={address}
                selected={selectedAddressId === address.id}
                pending={setAddress.isPending}
                onSelect={() =>
                  setAddress.mutate(
                    { addressId: address.id },
                    {
                      onError: (error) =>
                        toast.error(
                          error instanceof ApiError
                            ? error.message
                            : "We couldn't use that address.",
                        ),
                    },
                  )
                }
              />
            ))}

            {!addingAddress && (
              <button
                type="button"
                onClick={() => setAddingAddress(true)}
                className="inline-flex items-center gap-1.5 self-start rounded-full px-2 py-1.5 text-sm font-bold text-brand transition-colors hover:bg-brand-soft"
              >
                <Plus aria-hidden className="size-4" />
                Add new address
              </button>
            )}
          </div>
        )}

        {addingAddress && (
          <NewAddressForm
            onCancel={() => setAddingAddress(false)}
            onDone={(address) => {
              setAddingAddress(false);
              setAddress.mutate({ addressId: address.id });
            }}
          />
        )}

        {liveCart.delivery.etaMinutes !== null && (
          <p className="numeric rounded-[var(--radius-input)] bg-surface-muted px-3.5 py-2.5 text-sm text-secondary">
            Estimated arrival in about {liveCart.delivery.etaMinutes} min
            {liveCart.delivery.distanceKm !== null &&
              ` · ${liveCart.delivery.distanceKm.toFixed(1)} km away`}
          </p>
        )}

        <Field
          label="Delivery instructions"
          htmlFor="delivery-note"
          hint="Gate code, floor, anything the rider should know."
        >
          <Textarea
            id="delivery-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={200}
            placeholder="Call before delivery, gate code 1234…"
            className="min-h-24"
          />
        </Field>
      </Panel>

      {/* ── 2. How it is paid for ────────────────────────── */}
      <Panel title="Payment method" step={2}>
        {methods.isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-16 rounded-[var(--radius-input)]" />
            ))}
          </div>
        ) : available.length === 0 ? (
          <p className="rounded-[var(--radius-input)] bg-warning-soft px-3.5 py-3 text-sm font-medium text-warning">
            No payment method is available right now. Try again in a moment.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {available.map((gateway) => (
              <label
                key={gateway.method}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-[var(--radius-input)] border p-3.5 transition-colors",
                  "focus-within:ring-4 focus-within:ring-[var(--brand-ring)]",
                  method === gateway.method
                    ? "border-brand bg-brand-soft"
                    : "border-border-default bg-surface-muted hover:border-brand",
                )}
              >
                <input
                  type="radio"
                  name="payment-method"
                  className="sr-only"
                  checked={method === gateway.method}
                  onChange={() => setMethod(gateway.method)}
                />
                <span
                  aria-hidden
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    method === gateway.method
                      ? "bg-brand text-brand-contrast"
                      : "bg-surface text-secondary",
                  )}
                >
                  {METHOD_ICONS[gateway.method] ?? <Wallet className="size-5" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-bold text-primary">
                    {METHOD_LABELS[gateway.method] ?? gateway.name}
                  </span>
                  <span className="text-xs text-muted">{METHOD_HINTS[gateway.method] ?? ""}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        <p className="flex items-center gap-2 text-xs text-muted">
          <Lock aria-hidden className="size-3.5" />
          Payments are processed by the gateway — ZassDelivery never sees your card details.
        </p>
      </Panel>

      {/* ── 3. What it costs ─────────────────────────────── */}
      <Panel title="Order summary" step={3} className="lg:col-span-2 xl:col-span-1">
        <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
          <span className="size-11 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
            <Media src={liveCart.restaurant.logoUrl} variant="store" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-bold text-primary">{liveCart.restaurant.name}</span>
            <span className="numeric text-xs text-muted">
              {liveCart.totals.totalQuantity}{" "}
              {liveCart.totals.totalQuantity === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        <ul className="flex max-h-56 flex-col gap-2.5 overflow-y-auto">
          {liveCart.items.map((line) => (
            <li key={line.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 flex-1">
                <span className="numeric font-bold text-secondary">{line.quantity}× </span>
                <span className="text-primary">{line.name}</span>
              </span>
              <span className="numeric shrink-0 font-semibold text-primary">
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
          {blocking.length > 0 && (
            <ul className="flex flex-col gap-2">
              {blocking.map((issue) => (
                <li
                  key={issue.code}
                  className="rounded-[var(--radius-input)] bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger"
                >
                  {issue.message}
                </li>
              ))}
            </ul>
          )}

          <Button
            block
            size="lg"
            variant="neon"
            disabled={!canPlace || working}
            onClick={() => void submit()}
          >
            {working && <Loader2 aria-hidden className="size-4 animate-spin" />}
            Place order · {formatPrice(liveCart.totals.totalAmount)}
          </Button>

          {selectedAddressId === null && (
            <p className="text-center text-xs font-semibold text-warning">
              Choose a delivery address to continue.
            </p>
          )}

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <Lock aria-hidden className="size-3.5" />
            Your payment is secure and encrypted
          </p>
        </OrderSummary>
      </Panel>
    </div>
  );
}
