"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useCreateAddress } from "@/hooks/use-users";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AddressDto } from "@/types/user";

/**
 * The minimum an address needs to be saved, shared by checkout and the profile
 * so the two never drift. The map picker that fills in real coordinates is a
 * later phase — until then the point is saved unpinned and the zone is resolved
 * server-side.
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

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (line1.trim() === "") return;

        create.mutate(
          {
            line1: line1.trim(),
            ...(landmark.trim() !== "" && { landmark: landmark.trim() }),
            latitude: 0,
            longitude: 0,
          },
          {
            onSuccess: (address) => {
              toast.success("Address saved");
              setLine1("");
              setLandmark("");
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
        "flex flex-col gap-3 rounded-[var(--radius-input)] border border-dashed border-border-strong p-4",
        className,
      )}
    >
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

      <div className="flex gap-2">
        <Button type="submit" variant="outline" loading={create.isPending}>
          Save address
        </Button>
        {onCancel !== undefined && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
