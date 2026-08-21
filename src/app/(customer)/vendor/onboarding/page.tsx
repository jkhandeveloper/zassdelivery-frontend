"use client";

import { CheckCircle2, Store } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { LocationPicker, type PickedLocation } from "@/components/account/location-picker";
import { useAuth } from "@/components/providers/auth-provider";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { useRegisterRestaurant, useRestaurantCategories } from "@/hooks/use-restaurants";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { BUSINESS_TYPES, BUSINESS_TYPE_ORDER } from "@/lib/business-types";
import { UserRole } from "@/types/auth";
import { BusinessType, PriceRange } from "@/types/enums";

const PRICE_LABELS: Array<{ value: PriceRange; label: string }> = [
  { value: PriceRange.BUDGET, label: "Budget — under Rs 500 a head" },
  { value: PriceRange.MODERATE, label: "Moderate — Rs 500 to 1,500" },
  { value: PriceRange.PREMIUM, label: "Premium — over Rs 1,500" },
];

/**
 * Register a restaurant.
 *
 * The owner does this themselves — `POST /restaurant-management` is the owner's
 * own endpoint, and it creates the listing in PENDING_APPROVAL. An administrator
 * only approves or rejects what an owner has already filed; there is no path
 * where staff register a restaurant on someone's behalf, which is why this page
 * exists at all.
 *
 * Public by design: someone signing up to *become* a vendor does not hold the
 * VENDOR_OWNER role yet, so a guarded page would be unreachable by exactly the
 * people who need it. What it does instead is explain the one step they are
 * missing.
 */
export default function VendorOnboardingPage() {
  const { user, isReady, isAuthenticated } = useAuth();

  return (
    <div className="container-zass py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "List your business" }]}
      />

      <header className="mb-8 mt-4 flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">List your business</h1>
        <p className="max-w-2xl text-secondary">
          Restaurant, bakery, cafe, cafeteria or shop — tell us about it and we&apos;ll review the
          listing. Nothing goes live until an administrator approves it, usually within a working
          day.
        </p>
      </header>

      {!isReady ? (
        <Skeleton className="h-96 max-w-3xl rounded-[var(--radius-panel)]" />
      ) : !isAuthenticated ? (
        <EmptyState
          icon={<Store className="size-8" />}
          title="Create an owner account first"
          description="Sign up as a business owner, then come back here to register your place."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/register?next=%2Fvendor%2Fonboarding">Create an account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login?next=%2Fvendor%2Fonboarding">Sign in</Link>
              </Button>
            </div>
          }
        />
      ) : user?.role !== UserRole.VENDOR_OWNER ? (
        <EmptyState
          icon={<Store className="size-8" />}
          title="This needs a business owner account"
          description={`You're signed in as a ${user?.role.toLowerCase().replace(/_/g, " ")}. Listing a business needs an owner account — sign up as one, or ask support to change your role.`}
          action={
            <Button asChild variant="outline">
              <Link href="/support">Contact support</Link>
            </Button>
          }
        />
      ) : (
        <RegistrationForm />
      )}
    </div>
  );
}

function RegistrationForm() {
  const register = useRegisterRestaurant();
  const categories = useRestaurantCategories({ activeOnly: true });

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [addressLine, setAddressLine] = React.useState("");
  const [landmark, setLandmark] = React.useState("");
  const [location, setLocation] = React.useState<PickedLocation | null>(null);
  const [categoryIds, setCategoryIds] = React.useState<string[]>([]);
  const [businessType, setBusinessType] = React.useState<BusinessType>(BusinessType.RESTAURANT);
  const [priceRange, setPriceRange] = React.useState<PriceRange>(PriceRange.MODERATE);
  const [minOrderAmount, setMinOrderAmount] = React.useState("300");
  const [prepMinutes, setPrepMinutes] = React.useState("25");

  const [registered, setRegistered] = React.useState<string | null>(null);

  const canSubmit =
    name.trim() !== "" &&
    phone.trim() !== "" &&
    addressLine.trim() !== "" &&
    location !== null &&
    categoryIds.length > 0;

  if (registered !== null) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="size-8 text-success" />}
        title="Sent for review"
        description={`${registered} is registered and waiting on approval. You can start building your menu and setting your hours now — everything you set up goes live the moment it's approved.`}
        action={
          <Button asChild>
            <Link href="/vendor">Go to my dashboard</Link>
          </Button>
        }
      />
    );
  }

  return (
    <form
      className="flex max-w-3xl flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit || location === null) return;

        register.mutate(
          {
            name: name.trim(),
            ...(description.trim() !== "" && { description: description.trim() }),
            phone: phone.trim(),
            ...(email.trim() !== "" && { email: email.trim() }),
            addressLine: addressLine.trim(),
            ...(landmark.trim() !== "" && { landmark: landmark.trim() }),
            latitude: location.latitude,
            longitude: location.longitude,
            categoryIds,
            businessType,
            priceRange,
            minOrderAmount: Number(minOrderAmount),
            avgPreparationMinutes: Number(prepMinutes),
          },
          {
            onSuccess: (restaurant) => setRegistered(restaurant.name),
            onError: (error) =>
              toast.error(
                error instanceof ApiError
                  ? error.message
                  : "We couldn't register your business.",
              ),
          },
        );
      }}
    >
      <Section
        title="What kind of business is this?"
        description="It decides how customers find you — someone after a birthday cake browses bakeries, not restaurants."
      >
        <div
          role="radiogroup"
          aria-label="Kind of business"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {BUSINESS_TYPE_ORDER.map((type) => {
            const { label, icon: Icon } = BUSINESS_TYPES[type];
            const selected = businessType === type;

            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setBusinessType(type)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm font-semibold transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  selected
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-border-default bg-surface-muted text-secondary hover:border-brand",
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        <p className="text-sm text-muted">{BUSINESS_TYPES[businessType].hint}</p>
      </Section>

      <Section title="About your business">
        <Field label="Business name" htmlFor="reg-name" required>
          <Input
            id="reg-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Chapli Kabab House"
            required
          />
        </Field>

        <Field
          label="Description"
          htmlFor="reg-description"
          hint="A line or two — this sits under your name on the storefront."
        >
          <Textarea
            id="reg-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Charcoal-grilled kababs and fresh naan, seven days a week."
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone" htmlFor="reg-phone" required hint="Riders and support call this.">
            <Input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="03001234567"
              required
            />
          </Field>

          <Field label="Email" htmlFor="reg-email" hint="Optional.">
            <Input
              id="reg-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="orders@example.com"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Where you are"
        description="We resolve your delivery zone from this, and it decides what customers pay for delivery — so it has to be where you actually cook or trade."
      >
        <LocationPicker value={location} onChange={setLocation} />

        <span aria-hidden className="h-px bg-border-subtle" />

        <Field label="Street address" htmlFor="reg-address" required>
          <Input
            id="reg-address"
            value={addressLine}
            onChange={(event) => setAddressLine(event.target.value)}
            placeholder="Main GT Road, Pabbi"
            required
          />
        </Field>

        <Field label="Landmark" htmlFor="reg-landmark" hint="Optional, but riders love it.">
          <Input
            id="reg-landmark"
            value={landmark}
            onChange={(event) => setLandmark(event.target.value)}
            placeholder="Opposite the petrol pump"
          />
        </Field>
      </Section>

      <Section
        title="What you serve"
        description="Pick every cuisine that fits — customers filter the listings by these."
      >
        {categories.isPending ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        ) : categories.isError ? (
          <p className="text-sm font-medium text-danger">
            We couldn&apos;t load the cuisine list.{" "}
            <button
              type="button"
              onClick={() => void categories.refetch()}
              className="font-bold underline underline-offset-2"
            >
              Try again
            </button>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.data.items.map((category) => {
              const selected = categoryIds.includes(category.id);

              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setCategoryIds((current) =>
                      selected
                        ? current.filter((id) => id !== category.id)
                        : [...current, category.id],
                    )
                  }
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    selected
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-border-default bg-surface-muted text-secondary hover:border-brand",
                  )}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="How you'll trade">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Price range" htmlFor="reg-price" className="sm:col-span-2">
            <NativeSelect
              id="reg-price"
              value={priceRange}
              onChange={(event) => setPriceRange(event.target.value as PriceRange)}
            >
              {PRICE_LABELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Minimum order (Rs)" htmlFor="reg-min-order">
            <Input
              id="reg-min-order"
              value={minOrderAmount}
              onChange={(event) => setMinOrderAmount(event.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              className="numeric"
            />
          </Field>

          <Field
            label="Average prep time (minutes)"
            htmlFor="reg-prep"
            hint="Used to quote customers an arrival time."
          >
            <Input
              id="reg-prep"
              value={prepMinutes}
              onChange={(event) => setPrepMinutes(event.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="numeric"
            />
          </Field>
        </div>
      </Section>

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          size="lg"
          className="self-start"
          loading={register.isPending}
          disabled={!canSubmit}
        >
          Send for review
        </Button>

        {!canSubmit && (
          <p className="text-sm text-muted">
            We still need a name, phone number, street address, your location and at least one
            cuisine.
          </p>
        )}
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-extrabold text-primary">{title}</h2>
        {description !== undefined && <p className="text-sm text-secondary">{description}</p>}
      </div>
      {children}
    </section>
  );
}
