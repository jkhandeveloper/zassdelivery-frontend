"use client";

import { Clock, Flame, Leaf, MapPin, Star } from "lucide-react";
import * as React from "react";

import { MenuItemDialog } from "@/components/restaurant/menu-item-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MenuGridSkeleton, Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Badge } from "@/components/ui/status-pill";
import { useMenuItems, useRestaurantMenus } from "@/hooks/use-menus";
import { useRestaurant } from "@/hooks/use-restaurants";
import { cn, formatPrice } from "@/lib/utils";
import { SpiceLevel } from "@/types/enums";
import type { MenuItemDto } from "@/types/menu";

const SPICE_LABEL: Record<string, string> = {
  [SpiceLevel.MILD]: "Mild",
  [SpiceLevel.MEDIUM]: "Medium",
  [SpiceLevel.HOT]: "Hot",
  [SpiceLevel.EXTRA_HOT]: "Extra hot",
};

/** Why an item cannot be ordered, in the customer's words rather than the enum's. */
const UNAVAILABLE_COPY: Record<string, string> = {
  out_of_stock: "Sold out",
  sold_out: "Sold out",
  outside_window: "Not served right now",
  hidden: "Unavailable",
};

function MenuItemRow({ item, onSelect }: { item: MenuItemDto; onSelect: () => void }) {
  const discounted = item.discountedPrice !== null && item.discountedPrice < item.basePrice;
  const unavailable = !item.isAvailable;

  return (
    <Card
      interactive={!unavailable}
      className={cn("flex gap-4 p-4", unavailable && "opacity-60")}
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base font-extrabold text-primary">{item.name}</h3>
          {item.isVegetarian && (
            <span title="Vegetarian" className="text-success">
              <Leaf aria-label="Vegetarian" className="size-4" />
            </span>
          )}
          {item.spiceLevel !== SpiceLevel.NONE && SPICE_LABEL[item.spiceLevel] !== undefined && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
              <Flame aria-hidden className="size-3.5" />
              {SPICE_LABEL[item.spiceLevel]}
            </span>
          )}
          {item.isFeatured && <Badge variant="gold">Popular</Badge>}
        </div>

        {item.description !== null && item.description !== "" && (
          <p className="line-clamp-2 text-sm text-secondary">{item.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
          <span className="numeric font-semibold text-primary">
            {formatPrice(item.effectivePrice)}
          </span>
          {discounted && (
            <span className="numeric text-sm text-muted line-through">
              {formatPrice(item.basePrice)}
            </span>
          )}
          {item.ratingCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Star aria-hidden className="size-3.5 fill-accent-gold text-accent-gold" />
              <span className="numeric">{item.rating.toFixed(1)}</span>
            </span>
          )}
          {item.stockRemaining !== null && item.stockRemaining > 0 && item.stockRemaining <= 5 && (
            <span className="numeric text-xs text-warning">Only {item.stockRemaining} left</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        {item.imageUrl !== null && item.imageUrl !== "" && (
          // eslint-disable-next-line @next/next/no-img-element -- remote hosts are open-ended, so next/image would need unrestricted remotePatterns
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="size-20 rounded-xl object-cover"
          />
        )}
        {unavailable ? (
          <span className="text-xs font-semibold text-muted">
            {UNAVAILABLE_COPY[item.availabilityReason] ?? "Unavailable"}
          </span>
        ) : (
          <Button size="sm" variant="outline" onClick={onSelect}>
            Add
          </Button>
        )}
      </div>
    </Card>
  );
}

export function RestaurantDetail({ slug }: { slug: string }) {
  const restaurantQuery = useRestaurant(slug);
  const restaurant = restaurantQuery.data;

  const menusQuery = useRestaurantMenus(restaurant?.id);
  const itemsQuery = useMenuItems(restaurant?.id, { limit: 100 });

  const [selected, setSelected] = React.useState<MenuItemDto | null>(null);

  if (restaurantQuery.isPending) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-56 rounded-[var(--radius-panel)]" />
        <Skeleton className="h-8 w-64" />
        <MenuGridSkeleton />
      </div>
    );
  }

  if (restaurantQuery.isError || restaurant === undefined) {
    return (
      <ErrorState
        error={restaurantQuery.error}
        title="We couldn't find that restaurant"
        onRetry={() => void restaurantQuery.refetch()}
      />
    );
  }

  // Categories come nested on the menus; items arrive separately and are
  // grouped by menuCategoryId so each section renders in menu order.
  const categories = (menusQuery.data?.items ?? []).flatMap((menu) => menu.categories);
  const items = itemsQuery.data?.items ?? [];
  const grouped = categories
    .map((category) => ({
      category,
      items: items.filter((item) => item.menuCategoryId === category.id),
    }))
    .filter((section) => section.items.length > 0);

  // Anything whose category is missing from the menu tree still has to appear,
  // or it would be silently unorderable.
  const grouptedIds = new Set(grouped.flatMap((s) => s.items.map((i) => i.id)));
  const ungrouped = items.filter((item) => !grouptedIds.has(item.id));

  return (
    <div className="flex flex-col gap-8">
      <header className="overflow-hidden rounded-[var(--radius-panel)] border border-border-subtle bg-surface shadow-card">
        <div className="relative h-44 sm:h-56">
          {restaurant.coverUrl !== null && restaurant.coverUrl !== undefined && restaurant.coverUrl !== "" ? (
            // eslint-disable-next-line @next/next/no-img-element -- see above
            <img src={restaurant.coverUrl} alt="" className="size-full object-cover" />
          ) : (
            <div aria-hidden className="gradient-brand size-full" />
          )}
          {!restaurant.canOrderNow && (
            <div className="absolute inset-0 grid place-items-center bg-[rgb(0_0_0/0.55)]">
              <span className="rounded-full bg-surface px-4 py-2 font-semibold text-primary">
                {restaurant.isOpenNow ? "Not taking orders right now" : "Closed right now"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl">{restaurant.name}</h1>
            {restaurant.isFeatured && <Badge variant="gold">Featured</Badge>}
          </div>

          {restaurant.description !== null && restaurant.description !== undefined && restaurant.description !== "" && (
            <p className="max-w-2xl text-secondary">{restaurant.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-secondary">
            {restaurant.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Star aria-hidden className="size-4 fill-accent-gold text-accent-gold" />
                <span className="numeric font-semibold text-primary">
                  {restaurant.rating.toFixed(1)}
                </span>
                <span className="numeric text-muted">({restaurant.ratingCount})</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="size-4" />
              <span className="numeric">{restaurant.avgPreparationMinutes} min</span>
            </span>
            {restaurant.minOrderAmount > 0 && (
              <span className="numeric">Min order {formatPrice(restaurant.minOrderAmount)}</span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden className="size-4" />
              {restaurant.addressLine}
            </span>
          </div>

          {restaurant.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {restaurant.categories.map((category) => (
                <Badge key={category.id} variant="soft">
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl">Menu</h2>

        {itemsQuery.isPending || menusQuery.isPending ? (
          <MenuGridSkeleton />
        ) : itemsQuery.isError ? (
          <ErrorState error={itemsQuery.error} onRetry={() => void itemsQuery.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="This menu is empty"
            description="This restaurant hasn't published any dishes yet."
          />
        ) : (
          <div className="flex flex-col gap-8">
            {grouped.map(({ category, items: sectionItems }) => (
              <div key={category.id} className="flex flex-col gap-3">
                <h3 className="font-display text-lg font-extrabold text-primary">
                  {category.name}
                  {category.nameUr !== null && category.nameUr !== "" && (
                    <span className="pl-2 font-normal text-muted">{category.nameUr}</span>
                  )}
                </h3>
                <div className="grid gap-3 lg:grid-cols-2">
                  {sectionItems.map((item) => (
                    <MenuItemRow key={item.id} item={item} onSelect={() => setSelected(item)} />
                  ))}
                </div>
              </div>
            ))}

            {ungrouped.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="font-display text-lg font-extrabold text-primary">More</h3>
                <div className="grid gap-3 lg:grid-cols-2">
                  {ungrouped.map((item) => (
                    <MenuItemRow key={item.id} item={item} onSelect={() => setSelected(item)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {selected !== null && (
        <MenuItemDialog
          // Remount per item so variant and add-on choices never leak between dishes.
          key={selected.id}
          item={selected}
          restaurantName={restaurant.name}
          open
          onOpenChange={(next) => {
            if (!next) setSelected(null);
          }}
        />
      )}
    </div>
  );
}
