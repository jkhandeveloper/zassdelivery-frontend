"use client";

import { Package, Plus, Search, UtensilsCrossed } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Media } from "@/components/ui/media";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Badge, StatusPill } from "@/components/ui/status-pill";
import { VendorGate } from "@/components/vendor/vendor-gate";
import {
  useAdjustStock,
  useCreateMenuItem,
  useUpdateMenuItem,
  useVendorMenuItems,
  useVendorMenus,
} from "@/hooks/use-vendor";
import { ApiError } from "@/lib/api-client";
import { formatPrice, hasText } from "@/lib/utils";
import { MenuItemStatus, SpiceLevel } from "@/types/enums";
import type { MenuItemAdminDto } from "@/types/menu";

/** The picker value that means "type a name and make the section as we go". */
const NEW_SECTION = "__new__";

const SPICE_LABELS: Array<{ value: SpiceLevel; label: string }> = [
  { value: SpiceLevel.NONE, label: "Not spicy" },
  { value: SpiceLevel.MILD, label: "Mild" },
  { value: SpiceLevel.MEDIUM, label: "Medium" },
  { value: SpiceLevel.HOT, label: "Hot" },
  { value: SpiceLevel.EXTRA_HOT, label: "Extra hot" },
];

export default function VendorMenuPage() {
  return <VendorGate allowUnapproved>{(restaurant) => <Menu restaurantId={restaurant.id} />}</VendorGate>;
}

function Menu({ restaurantId }: { restaurantId: string }) {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [status, setStatus] = React.useState<MenuItemStatus | "">("");
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const items = useVendorMenuItems(restaurantId, {
    limit: 100,
    ...(debounced.trim() !== "" && { search: debounced.trim() }),
    ...(status !== "" && { status }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Menu"
        description="Everything you sell. Flip a dish out of stock the moment it runs out — customers see it straight away."
        action={
          !adding && (
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              Add dish
            </Button>
          )
        }
      />

      {adding && (
        <AddDishForm restaurantId={restaurantId} onDone={() => setAdding(false)} />
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <label htmlFor="menu-search" className="sr-only">
            Search your menu
          </label>
          <Input
            id="menu-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search dishes…"
            className="h-11 pl-11"
          />
        </div>

        <label htmlFor="menu-status" className="sr-only">
          Filter by status
        </label>
        <NativeSelect
          id="menu-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as MenuItemStatus | "")}
          className="h-11 w-48"
        >
          <option value="">All dishes</option>
          <option value={MenuItemStatus.AVAILABLE}>Available</option>
          <option value={MenuItemStatus.OUT_OF_STOCK}>Out of stock</option>
          <option value={MenuItemStatus.HIDDEN}>Hidden</option>
        </NativeSelect>
      </div>

      <Panel bodyClassName="p-0">
        {items.isPending ? (
          <div className="p-5 sm:p-6">
            <ListSkeleton label="Loading your menu" count={5} />
          </div>
        ) : items.isError ? (
          <ErrorState density="inline" error={items.error} onRetry={() => void items.refetch()} />
        ) : items.data.items.length === 0 ? (
          <EmptyState
            density="inline"
            icon={<UtensilsCrossed className="size-6" />}
            title={debounced === "" ? "No dishes yet" : "Nothing matched"}
            description={
              debounced === ""
                ? "Your menu is empty. Add dishes and they'll show on your storefront."
                : "Try a different search, or clear the filters."
            }
            action={
              debounced === "" && !adding ? (
                <Button onClick={() => setAdding(true)}>
                  <Plus className="size-4" />
                  Add your first dish
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {items.data.items.map((item) => (
              <li key={item.id}>
                <MenuRow item={item} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/**
 * Adding a dish, including for a restaurant that has no menu yet.
 *
 * A dish belongs to a section, so the section has to exist first — but making
 * a vendor go and build a menu tree before they can type in their first kebab
 * is the wrong order. Picking "New section" here creates the menu and the
 * section on the way through; see `useCreateMenuItem`.
 */
function AddDishForm({
  restaurantId,
  onDone,
}: {
  restaurantId: string;
  onDone: () => void;
}) {
  const menus = useVendorMenus(restaurantId);
  const create = useCreateMenuItem(restaurantId);

  const sections = React.useMemo(
    () =>
      (menus.data?.items ?? []).flatMap((menu) =>
        menu.categories.map((category) => ({
          id: category.id,
          // The menu name only earns its place when there is more than one.
          label:
            (menus.data?.items.length ?? 0) > 1
              ? `${menu.name} · ${category.name}`
              : category.name,
        })),
      ),
    [menus.data],
  );

  const [chosenSection, setChosenSection] = React.useState<string | null>(null);
  const [newSection, setNewSection] = React.useState("");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [basePrice, setBasePrice] = React.useState("");
  const [discountedPrice, setDiscountedPrice] = React.useState("");
  const [prepMinutes, setPrepMinutes] = React.useState("");
  const [spiceLevel, setSpiceLevel] = React.useState<SpiceLevel>(SpiceLevel.NONE);
  const [isVegetarian, setIsVegetarian] = React.useState(false);

  // Falls back to the first section as soon as the menu tree arrives, without
  // an effect overwriting a choice the vendor has already made — and to "new
  // section" for a restaurant that has none.
  const section = chosenSection ?? sections[0]?.id ?? NEW_SECTION;
  const creatingSection = !menus.isPending && section === NEW_SECTION;

  const price = Number(basePrice);
  const discount = discountedPrice.trim() === "" ? null : Number(discountedPrice);

  const priceError =
    basePrice.trim() !== "" && (!Number.isFinite(price) || price < 0)
      ? "Enter a price in rupees, e.g. 450."
      : undefined;

  // The API refuses a promotional price above the base one; saying so here
  // beats a round trip to find out.
  const discountError =
    discount !== null && (!Number.isFinite(discount) || discount < 0)
      ? "Enter an amount in rupees, or leave it empty."
      : discount !== null && Number.isFinite(price) && discount > price
        ? "An offer price has to be below the normal price."
        : undefined;

  const canSubmit =
    !menus.isPending &&
    name.trim().length >= 2 &&
    basePrice.trim() !== "" &&
    priceError === undefined &&
    discountError === undefined &&
    (creatingSection ? newSection.trim() !== "" : true);

  return (
    <Panel
      title="Add a dish"
      description="It goes live on your storefront as soon as it's saved — mark it sold out any time."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;

          create.mutate(
            {
              menuCategoryId: creatingSection ? null : section,
              ...(creatingSection && { newSectionName: newSection.trim() }),
              dish: {
                name: name.trim(),
                basePrice: price,
                spiceLevel,
                isVegetarian,
                ...(description.trim() !== "" && { description: description.trim() }),
                ...(discount !== null && { discountedPrice: discount }),
                ...(prepMinutes.trim() !== "" && {
                  preparationMinutes: Number(prepMinutes),
                }),
              },
            },
            {
              onSuccess: (dish) => {
                toast.success(`${dish.name} is on your menu`);
                onDone();
              },
              onError: (error) =>
                toast.error(
                  error instanceof ApiError ? error.message : "We couldn't add that dish.",
                ),
            },
          );
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Section"
            htmlFor="dish-section"
            required
            hint={
              menus.isPending
                ? "Loading your menu…"
                : sections.length === 0
                  ? "You have no sections yet — name one and we'll create it."
                  : undefined
            }
          >
            <NativeSelect
              id="dish-section"
              value={section}
              onChange={(event) => setChosenSection(event.target.value)}
              disabled={menus.isPending}
            >
              {sections.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
              <option value={NEW_SECTION}>New section…</option>
            </NativeSelect>
          </Field>

          {creatingSection && (
            <Field
              label="New section name"
              htmlFor="dish-new-section"
              required
              hint="How it's headed on your storefront, e.g. Karahi."
            >
              <Input
                id="dish-new-section"
                value={newSection}
                onChange={(event) => setNewSection(event.target.value)}
                placeholder="Starters"
                required
              />
            </Field>
          )}

          <Field label="Dish name" htmlFor="dish-name" required>
            <Input
              id="dish-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Chapli Kabab"
              maxLength={140}
              required
            />
          </Field>

          <Field label="Price (Rs)" htmlFor="dish-price" required error={priceError}>
            <Input
              id="dish-price"
              value={basePrice}
              onChange={(event) => setBasePrice(event.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              placeholder="450"
              invalid={priceError !== undefined}
              className="numeric"
              required
            />
          </Field>

          <Field
            label="Offer price (Rs)"
            htmlFor="dish-discount"
            hint={discountError === undefined ? "Optional." : undefined}
            error={discountError}
          >
            <Input
              id="dish-discount"
              value={discountedPrice}
              onChange={(event) =>
                setDiscountedPrice(event.target.value.replace(/[^\d.]/g, ""))
              }
              inputMode="decimal"
              placeholder="399"
              invalid={discountError !== undefined}
              className="numeric"
            />
          </Field>

          <Field
            label="Preparation time"
            htmlFor="dish-prep"
            hint="Minutes. Optional — your restaurant's average is used otherwise."
          >
            <Input
              id="dish-prep"
              value={prepMinutes}
              onChange={(event) => setPrepMinutes(event.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="15"
              className="numeric"
            />
          </Field>

          <Field label="Spice level" htmlFor="dish-spice">
            <NativeSelect
              id="dish-spice"
              value={spiceLevel}
              onChange={(event) => setSpiceLevel(event.target.value as SpiceLevel)}
            >
              {SPICE_LABELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>

        <Field
          label="Description"
          htmlFor="dish-description"
          hint="Optional. What's in it, in a line."
        >
          <Textarea
            id="dish-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Minced beef patty with tomato, coriander and pomegranate seeds."
            maxLength={800}
            rows={2}
          />
        </Field>

        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isVegetarian}
            onChange={(event) => setIsVegetarian(event.target.checked)}
            className="size-4 accent-[var(--brand)]"
          />
          <span className="font-semibold text-primary">Vegetarian</span>
        </label>

        <div className="flex gap-2">
          <Button type="submit" loading={create.isPending} disabled={!canSubmit}>
            Add to menu
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function MenuRow({ item }: { item: MenuItemAdminDto }) {
  const update = useUpdateMenuItem();
  const adjust = useAdjustStock();
  const [stock, setStock] = React.useState("");

  const fail = (error: unknown, fallback: string) =>
    toast.error(error instanceof ApiError ? error.message : fallback);

  const setStatus = (next: MenuItemStatus) =>
    update.mutate(
      { itemId: item.id, data: { status: next } },
      {
        onSuccess: () => toast.success(`${item.name} updated`),
        onError: (error) => fail(error, "We couldn't update that dish."),
      },
    );

  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6">
      <span className="size-14 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
        <Media src={item.imageUrl} alt="" variant="food" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-bold text-primary">{item.name}</span>
          {item.isFeatured && (
            <Badge variant="gold" size="sm">
              Featured
            </Badge>
          )}
          {item.isLowStock && (
            <Badge variant="warm" size="sm">
              Low stock
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="numeric font-semibold text-secondary">
            {formatPrice(item.effectivePrice)}
            {item.discountedPrice !== null && (
              <span className="ml-1.5 font-normal line-through">
                {formatPrice(item.basePrice)}
              </span>
            )}
          </span>
          {item.trackInventory && (
            <span className="numeric">{item.stockQuantity} in stock</span>
          )}
          {hasText(item.description) && (
            <span className="hidden max-w-md truncate sm:inline">{item.description}</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <StatusPill status={item.status} size="sm" />

        {item.trackInventory && (
          <form
            className="flex items-center gap-1.5"
            onSubmit={(event) => {
              event.preventDefault();
              // The endpoint takes a signed *delta*, applied atomically so two
              // concurrent sales cannot oversell — sending an absolute count
              // here would quietly clobber whatever sold while this was typed.
              const delta = Number(stock);
              if (!Number.isInteger(delta) || delta === 0) return;

              adjust.mutate(
                { itemId: item.id, data: { delta } },
                {
                  onSuccess: (updated) => {
                    toast.success(`${item.name}: ${updated.stockQuantity} in stock`);
                    setStock("");
                  },
                  onError: (error) => fail(error, "We couldn't adjust the stock."),
                },
              );
            }}
          >
            <label htmlFor={`stock-${item.id}`} className="sr-only">
              Add to or remove from stock for {item.name}
            </label>
            <Input
              id={`stock-${item.id}`}
              value={stock}
              onChange={(event) => setStock(event.target.value.replace(/[^\d-]/g, ""))}
              inputMode="numeric"
              placeholder="±0"
              title="Add or remove stock, e.g. 12 or -3"
              className="numeric h-9 w-20 text-center"
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              loading={adjust.isPending}
              disabled={!Number.isInteger(Number(stock)) || stock === "" || Number(stock) === 0}
            >
              <Package className="size-4" />
              Adjust
            </Button>
          </form>
        )}

        {item.status === MenuItemStatus.AVAILABLE ? (
          <Button
            size="sm"
            variant="outline"
            loading={update.isPending}
            onClick={() => setStatus(MenuItemStatus.OUT_OF_STOCK)}
          >
            Mark sold out
          </Button>
        ) : (
          <Button
            size="sm"
            variant="success"
            loading={update.isPending}
            onClick={() => setStatus(MenuItemStatus.AVAILABLE)}
          >
            Make available
          </Button>
        )}

        {item.status !== MenuItemStatus.HIDDEN ? (
          <Button
            size="sm"
            variant="ghost"
            loading={update.isPending}
            onClick={() => setStatus(MenuItemStatus.HIDDEN)}
          >
            Hide
          </Button>
        ) : null}
      </div>
    </div>
  );
}
