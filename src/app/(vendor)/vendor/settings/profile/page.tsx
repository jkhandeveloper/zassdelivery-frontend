"use client";

import * as React from "react";
import { toast } from "sonner";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { VendorGate } from "@/components/vendor/vendor-gate";
import { useUpdateMyRestaurant } from "@/hooks/use-vendor";
import { ApiError } from "@/lib/api-client";
import { PriceRange } from "@/types/enums";
import type { RestaurantAdminDto } from "@/types/restaurant";

const PRICE_LABELS: Array<{ value: PriceRange; label: string }> = [
  { value: PriceRange.BUDGET, label: "Budget — under Rs 500 a head" },
  { value: PriceRange.MODERATE, label: "Moderate — Rs 500 to 1,500" },
  { value: PriceRange.PREMIUM, label: "Premium — over Rs 1,500" },
];

export default function VendorProfilePage() {
  return (
    <VendorGate allowUnapproved>
      {(restaurant) => <ProfileForm restaurant={restaurant} />}
    </VendorGate>
  );
}

function ProfileForm({ restaurant }: { restaurant: RestaurantAdminDto }) {
  const update = useUpdateMyRestaurant(restaurant.id);

  const [name, setName] = React.useState(restaurant.name);
  const [description, setDescription] = React.useState(restaurant.description ?? "");
  const [phone, setPhone] = React.useState(restaurant.phone);
  const [addressLine, setAddressLine] = React.useState(restaurant.addressLine);
  const [landmark, setLandmark] = React.useState(restaurant.landmark ?? "");
  const [priceRange, setPriceRange] = React.useState<PriceRange>(restaurant.priceRange);
  const [minOrderAmount, setMinOrderAmount] = React.useState(String(restaurant.minOrderAmount));
  const [prepMinutes, setPrepMinutes] = React.useState(
    String(restaurant.avgPreparationMinutes),
  );
  const [radiusKm, setRadiusKm] = React.useState(
    (restaurant.deliveryRadiusMeters / 1000).toFixed(1),
  );

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Restaurant details"
        description="What customers see on your storefront."
        action={<StatusPill status={restaurant.status} />}
      />

      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();

          update.mutate(
            {
              name: name.trim(),
              description: description.trim(),
              phone: phone.trim(),
              addressLine: addressLine.trim(),
              landmark: landmark.trim(),
              priceRange,
              minOrderAmount: Number(minOrderAmount),
              avgPreparationMinutes: Number(prepMinutes),
              deliveryRadiusMeters: Math.round(Number(radiusKm) * 1000),
            },
            {
              onSuccess: () => toast.success("Details saved"),
              onError: (error) =>
                toast.error(
                  error instanceof ApiError ? error.message : "We couldn't save those details.",
                ),
            },
          );
        }}
      >
        <Panel title="The basics">
          <div className="flex flex-col gap-4">
            <Field label="Restaurant name" htmlFor="vendor-name" required>
              <Input
                id="vendor-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </Field>

            <Field
              label="Description"
              htmlFor="vendor-description"
              hint="A line or two about the kitchen — this sits under your name on the storefront."
            >
              <Textarea
                id="vendor-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Charcoal-grilled kababs and fresh naan, seven days a week."
              />
            </Field>

            <Field label="Phone" htmlFor="vendor-phone" required hint="Riders and support call this.">
              <Input
                id="vendor-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Where you are"
          description="The map pin decides which delivery zone you sit in, so it's set when you register and changed by support."
        >
          <div className="flex flex-col gap-4">
            <Field label="Street address" htmlFor="vendor-address" required>
              <Input
                id="vendor-address"
                value={addressLine}
                onChange={(event) => setAddressLine(event.target.value)}
                required
              />
            </Field>

            <Field label="Landmark" htmlFor="vendor-landmark" hint="Optional, but riders love it.">
              <Input
                id="vendor-landmark"
                value={landmark}
                onChange={(event) => setLandmark(event.target.value)}
                placeholder="Opposite the petrol pump"
              />
            </Field>

            <p className="rounded-[var(--radius-input)] bg-surface-muted px-3.5 py-2.5 text-sm text-secondary">
              Currently listed in <strong className="text-primary">{restaurant.zone.name}</strong>,{" "}
              {restaurant.city.name}.
            </p>
          </div>
        </Panel>

        <Panel title="How you trade">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Price range" htmlFor="vendor-price" className="sm:col-span-2">
              <NativeSelect
                id="vendor-price"
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

            <Field label="Minimum order (Rs)" htmlFor="vendor-min-order">
              <Input
                id="vendor-min-order"
                value={minOrderAmount}
                onChange={(event) => setMinOrderAmount(event.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                className="numeric"
              />
            </Field>

            <Field
              label="Average prep time (minutes)"
              htmlFor="vendor-prep"
              hint="Used to quote the customer an arrival time."
            >
              <Input
                id="vendor-prep"
                value={prepMinutes}
                onChange={(event) => setPrepMinutes(event.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className="numeric"
              />
            </Field>

            <Field
              label="Delivery radius (km)"
              htmlFor="vendor-radius"
              hint="How far from your door you'll deliver."
              className="sm:col-span-2"
            >
              <Input
                id="vendor-radius"
                value={radiusKm}
                onChange={(event) => setRadiusKm(event.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                className="numeric"
              />
            </Field>
          </div>
        </Panel>

        <div>
          <Button type="submit" loading={update.isPending}>
            Save details
          </Button>
        </div>
      </form>
    </div>
  );
}
