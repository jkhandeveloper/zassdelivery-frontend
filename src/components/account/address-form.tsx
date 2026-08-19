"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { useCreateAddress } from "@/hooks/use-users";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { AddressLabel } from "@/types/enums";
import type { AddressDto } from "@/types/user";

import { LocationPicker, type PickedLocation } from "./location-picker";

const LABELS: Array<{ value: AddressLabel; text: string }> = [
  { value: AddressLabel.HOME, text: "Home" },
  { value: AddressLabel.WORK, text: "Work" },
  { value: AddressLabel.OTHER, text: "Other" },
];

/**
 * The minimum an address needs to be saved, shared by checkout and the profile
 * so the two never drift.
 *
 * The location comes from {@link LocationPicker} rather than a hardcoded point:
 * the API resolves the delivery zone from the coordinates and rejects anything
 * outside one, so real coordinates are not a refinement here, they are the
 * difference between an address that saves and one that never can.
 */
export function NewAddressForm({
  onDone,
  onCancel,
  className,
}: {
  onDone: (address: AddressDto) => void;
  onCancel?: () => void;
  className?: string;
}) {
  const create = useCreateAddress();
  const [line1, setLine1] = React.useState("");
  const [landmark, setLandmark] = React.useState("");
  const [label, setLabel] = React.useState<AddressLabel>(AddressLabel.HOME);
  const [location, setLocation] = React.useState<PickedLocation | null>(null);

  const canSubmit = line1.trim() !== "" && location !== null;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit || location === null) return;

        create.mutate(
          {
            label,
            line1: line1.trim(),
            ...(landmark.trim() !== "" && { landmark: landmark.trim() }),
            latitude: location.latitude,
            longitude: location.longitude,
          },
          {
            onSuccess: (address) => {
              toast.success("Address saved");
              setLine1("");
              setLandmark("");
              setLocation(null);
              onDone(address);
            },
            onError: (error) =>
              toast.error(
                error instanceof ApiError ? error.message : "We couldn't save that address.",
              ),
          },
        );
      }}
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-input)] border border-dashed border-border-strong p-4",
        className,
      )}
    >
      <LocationPicker value={location} onChange={setLocation} />

      <span aria-hidden className="h-px bg-border-subtle" />

      <Field label="Street address" htmlFor="new-address-line1" required>
        <Input
          id="new-address-line1"
          value={line1}
          onChange={(event) => setLine1(event.target.value)}
          placeholder="House 12, Street 4, University Road"
          className="h-11"
          required
        />
      </Field>

      <Field label="Landmark" htmlFor="new-address-landmark" hint="Optional, but riders love it.">
        <Input
          id="new-address-landmark"
          value={landmark}
          onChange={(event) => setLandmark(event.target.value)}
          placeholder="Opposite the pharmacy"
          className="h-11"
        />
      </Field>

      <Field label="Save as" htmlFor="new-address-label">
        <NativeSelect
          id="new-address-label"
          value={label}
          onChange={(event) => setLabel(event.target.value as AddressLabel)}
          className="h-11"
        >
          {LABELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.text}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <div className="flex gap-2">
        <Button type="submit" variant="outline" loading={create.isPending} disabled={!canSubmit}>
          Save address
        </Button>
        {onCancel !== undefined && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {location === null && (
        <p className="text-xs font-semibold text-warning">
          Choose where you are above before saving.
        </p>
      )}
    </form>
  );
}
