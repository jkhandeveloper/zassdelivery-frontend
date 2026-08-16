"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { Textarea } from "@/components/ui/input";
import { useAddCartItem } from "@/hooks/use-cart";
import { ApiError } from "@/lib/api-client";
import { cn, formatPrice } from "@/lib/utils";
import type { AddOnGroupDto, MenuItemDto } from "@/types/menu";

/** Selected add-on ids, grouped so min/max can be enforced per group. */
type Selections = Record<string, string[]>;

function defaultVariantId(item: MenuItemDto): string | null {
  if (item.variants.length === 0) return null;
  const preferred = item.variants.find((v) => v.isDefault && v.isAvailable);
  return (preferred ?? item.variants.find((v) => v.isAvailable) ?? item.variants[0]).id;
}

function groupSatisfied(group: AddOnGroupDto, chosen: string[]): boolean {
  if (group.isRequired && chosen.length === 0) return false;
  return chosen.length >= group.minSelect;
}

export function MenuItemDialog({
  item,
  restaurantName,
  open,
  onOpenChange,
}: {
  item: MenuItemDto;
  restaurantName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const addItem = useAddCartItem();

  const [variantId, setVariantId] = React.useState<string | null>(() => defaultVariantId(item));
  const [selections, setSelections] = React.useState<Selections>({});
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState("");

  const variant = item.variants.find((v) => v.id === variantId) ?? null;

  // A variant's price is absolute, not a delta on basePrice.
  const unitBase = variant?.price ?? item.effectivePrice;

  const addOnTotal = React.useMemo(() => {
    let sum = 0;
    for (const group of item.addOnGroups) {
      for (const id of selections[group.id] ?? []) {
        sum += group.addOns.find((a) => a.id === id)?.price ?? 0;
      }
    }
    return sum;
  }, [item.addOnGroups, selections]);

  const total = (unitBase + addOnTotal) * quantity;

  const unmetGroup = item.addOnGroups.find(
    (group) => !groupSatisfied(group, selections[group.id] ?? []),
  );

  const toggleAddOn = (group: AddOnGroupDto, addOnId: string) => {
    setSelections((current) => {
      const chosen = current[group.id] ?? [];
      const isOn = chosen.includes(addOnId);

      if (isOn) {
        return { ...current, [group.id]: chosen.filter((id) => id !== addOnId) };
      }

      // maxSelect 1 behaves as a radio: picking one replaces the other.
      if (group.maxSelect === 1) {
        return { ...current, [group.id]: [addOnId] };
      }

      if (chosen.length >= group.maxSelect) {
        return current;
      }

      return { ...current, [group.id]: [...chosen, addOnId] };
    });
  };

  const submit = async () => {
    if (!isAuthenticated) {
      onOpenChange(false);
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const addOns = Object.values(selections)
      .flat()
      .map((addOnId) => ({ addOnId, quantity: 1 }));

    try {
      await addItem.mutateAsync({
        menuItemId: item.id,
        quantity,
        ...(variantId !== null && { variantId }),
        ...(notes.trim() !== "" && { notes: notes.trim() }),
        ...(addOns.length > 0 && { addOns }),
      });

      toast.success(`${item.name} added to your cart`);
      onOpenChange(false);
    } catch (error) {
      // The cart is single-restaurant; switching kitchens is a real decision,
      // so say so plainly rather than showing a raw conflict error.
      const message =
        error instanceof ApiError
          ? error.status === 409
            ? "Your cart has items from another restaurant. Empty it first to order from here."
            : error.message
          : "We couldn't add that. Please try again.";

      toast.error(message);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md">
        <ModalHeader>
          <ModalTitle>{item.name}</ModalTitle>
          <ModalDescription>
            {item.description ?? `From ${restaurantName}`}
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="flex flex-col gap-6">
          {item.variants.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="pb-2 text-sm font-bold text-primary">Choose a size</legend>
              <div className="flex flex-col gap-2">
                {item.variants.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-input)] border p-3 transition-colors",
                      "focus-within:ring-4 focus-within:ring-[var(--brand-ring)]",
                      !option.isAvailable && "cursor-not-allowed opacity-50",
                      variantId === option.id
                        ? "border-brand bg-brand-soft"
                        : "border-border-default bg-surface-muted hover:border-brand",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="variant"
                        className="sr-only"
                        checked={variantId === option.id}
                        disabled={!option.isAvailable}
                        onChange={() => setVariantId(option.id)}
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-4 place-items-center rounded-full border-2",
                          variantId === option.id ? "border-brand" : "border-border-strong",
                        )}
                      >
                        {variantId === option.id && <span className="size-2 rounded-full bg-brand" />}
                      </span>
                      <span className="text-sm font-semibold text-primary">{option.name}</span>
                    </span>
                    <span className="numeric text-sm font-semibold text-secondary">
                      {formatPrice(option.price)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {item.addOnGroups.map((group) => {
            const chosen = selections[group.id] ?? [];

            return (
              <fieldset key={group.id} className="flex flex-col gap-2">
                <legend className="flex flex-wrap items-baseline gap-2 pb-2">
                  <span className="text-sm font-bold text-primary">{group.name}</span>
                  <span className="text-xs text-muted">
                    {group.isRequired ? "Required" : "Optional"}
                    {group.maxSelect > 1 && ` · up to ${group.maxSelect}`}
                  </span>
                </legend>

                <div className="flex flex-col gap-2">
                  {group.addOns.map((addOn) => {
                    const isOn = chosen.includes(addOn.id);
                    const atLimit = !isOn && group.maxSelect > 1 && chosen.length >= group.maxSelect;

                    return (
                      <label
                        key={addOn.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-input)] border p-3 transition-colors",
                          "focus-within:ring-4 focus-within:ring-[var(--brand-ring)]",
                          (!addOn.isAvailable || atLimit) && "cursor-not-allowed opacity-50",
                          isOn
                            ? "border-brand bg-brand-soft"
                            : "border-border-default bg-surface-muted hover:border-brand",
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <input
                            type={group.maxSelect === 1 ? "radio" : "checkbox"}
                            name={group.id}
                            className="sr-only"
                            checked={isOn}
                            disabled={!addOn.isAvailable || atLimit}
                            onChange={() => toggleAddOn(group, addOn.id)}
                          />
                          <span
                            aria-hidden
                            className={cn(
                              "grid size-4 place-items-center border-2",
                              group.maxSelect === 1 ? "rounded-full" : "rounded",
                              isOn ? "border-brand bg-brand" : "border-border-strong",
                            )}
                          >
                            {isOn && <span className="text-[10px] font-bold text-brand-contrast">✓</span>}
                          </span>
                          <span className="text-sm font-semibold text-primary">{addOn.name}</span>
                        </span>
                        {addOn.price > 0 && (
                          <span className="numeric text-sm text-secondary">
                            + {formatPrice(addOn.price)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="item-notes" className="text-sm font-bold text-primary">
              Anything to tell the kitchen?
            </label>
            <Textarea
              id="item-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="No onions, extra spicy…"
              maxLength={200}
              className="min-h-20"
            />
          </div>
        </ModalBody>

        <ModalFooter className="flex-col gap-3 sm:flex-row sm:items-center">
          <QuantitySelector value={quantity} onChange={setQuantity} max={99} itemLabel={item.name} />
          <Button
            className="flex-1"
            size="lg"
            loading={addItem.isPending}
            loadingLabel="Adding to cart…"
            disabled={unmetGroup !== undefined || !item.isAvailable}
            onClick={() => void submit()}
          >
            {unmetGroup !== undefined
              ? `Choose ${unmetGroup.name}`
              : `Add for ${formatPrice(total)}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
