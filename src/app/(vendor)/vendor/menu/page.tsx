"use client";

import { Package, Search, UtensilsCrossed } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Media } from "@/components/ui/media";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Badge, StatusPill } from "@/components/ui/status-pill";
import { VendorGate } from "@/components/vendor/vendor-gate";
import { useAdjustStock, useUpdateMenuItem, useVendorMenuItems } from "@/hooks/use-vendor";
import { ApiError } from "@/lib/api-client";
import { formatPrice, hasText } from "@/lib/utils";
import { MenuItemStatus } from "@/types/enums";
import type { MenuItemAdminDto } from "@/types/menu";

export default function VendorMenuPage() {
  return <VendorGate allowUnapproved>{(restaurant) => <Menu restaurantId={restaurant.id} />}</VendorGate>;
}

function Menu({ restaurantId }: { restaurantId: string }) {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [status, setStatus] = React.useState<MenuItemStatus | "">("");

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
      />

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
