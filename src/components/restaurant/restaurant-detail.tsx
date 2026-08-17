"use client";

import { BadgeCheck, Clock, Flame, Leaf, MapPin, Phone, Star } from "lucide-react";
import * as React from "react";

import { DishCard } from "@/components/restaurant/dish-card";
import { MenuItemDialog } from "@/components/restaurant/menu-item-dialog";
import { RestaurantOrderPanel } from "@/components/restaurant/order-panel";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Media } from "@/components/ui/media";
import { MenuGridSkeleton, Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Badge } from "@/components/ui/status-pill";
import { useMenuItems, useRestaurantMenus } from "@/hooks/use-menus";
import { useQuickAdd } from "@/hooks/use-quick-add";
import { useRestaurant, useRestaurantHours } from "@/hooks/use-restaurants";
import { cn, formatLandmark, formatPrice, hasText } from "@/lib/utils";
import { SpiceLevel } from "@/types/enums";
import type { MenuItemDto } from "@/types/menu";
import type { RestaurantDto } from "@/types/restaurant";

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
  outside_window: "Not served now",
  hidden: "Unavailable",
};

/**
 * An item with sizes, or with a group that must be chosen from, cannot be added
 * in one tap — picking a default on the customer's behalf is picking what they
 * pay. Those open the dialog instead.
 */
function needsChoices(item: MenuItemDto): boolean {
  return (
    item.variants.length > 0 ||
    item.addOnGroups.some((group) => group.isRequired || group.minSelect > 0)
  );
}

function DishNote({ item }: { item: MenuItemDto }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      {item.isVegetarian && (
        <span className="inline-flex items-center gap-1 text-success">
          <Leaf aria-hidden className="size-3.5" />
          Veg
        </span>
      )}
      {item.spiceLevel !== SpiceLevel.NONE && SPICE_LABEL[item.spiceLevel] !== undefined && (
        <span className="inline-flex items-center gap-1">
          <Flame aria-hidden className="size-3.5" />
          {SPICE_LABEL[item.spiceLevel]}
        </span>
      )}
      {item.preparationMinutes > 0 && (
        <span className="numeric inline-flex items-center gap-1">
          <Clock aria-hidden className="size-3.5" />
          {item.preparationMinutes} min
        </span>
      )}
      {item.stockRemaining !== null && item.stockRemaining > 0 && item.stockRemaining <= 5 && (
        <span className="numeric font-semibold text-warning">
          Only {item.stockRemaining} left
        </span>
      )}
    </span>
  );
}

export function RestaurantDetail({ slug }: { slug: string }) {
  const restaurantQuery = useRestaurant(slug);
  const restaurant = restaurantQuery.data;

  const menusQuery = useRestaurantMenus(restaurant?.id);
  const itemsQuery = useMenuItems(restaurant?.id, { limit: 100 });

  const [selected, setSelected] = React.useState<MenuItemDto | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [tab, setTab] = React.useState<"menu" | "about">("menu");

  const { add, pendingItemId } = useQuickAdd();

  if (restaurantQuery.isPending) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-64 rounded-[var(--radius-panel)]" />
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

  // Categories come nested on the menus; items arrive separately and are grouped
  // by menuCategoryId so each section renders in menu order.
  const categories = (menusQuery.data?.items ?? []).flatMap((menu) => menu.categories);
  const items = itemsQuery.data?.items ?? [];

  const categoriesWithItems = categories.filter((category) =>
    items.some((item) => item.menuCategoryId === category.id),
  );

  // Anything whose category is missing from the menu tree still has to appear,
  // or it would be silently unorderable.
  const categorised = new Set(categoriesWithItems.map((category) => category.id));
  const ungrouped = items.filter((item) => !categorised.has(item.menuCategoryId));

  const sections = [
    ...categoriesWithItems.map((category) => ({
      id: category.id,
      name: category.name,
      items: items.filter((item) => item.menuCategoryId === category.id),
    })),
    ...(ungrouped.length > 0 ? [{ id: "more", name: "More", items: ungrouped }] : []),
  ].filter((section) => activeCategory === "all" || section.id === activeCategory);

  const onAdd = (item: MenuItemDto) => {
    if (needsChoices(item)) {
      setSelected(item);
      return;
    }
    void add({ menuItemId: item.id, name: item.name });
  };

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Restaurants", href: "/restaurants" },
          { label: restaurant.name },
        ]}
      />

      {/* ── Cover and identity ───────────────────────────── */}
      <header className="flex flex-col">
        <div className="relative h-48 overflow-hidden rounded-[var(--radius-panel)] sm:h-64 lg:h-72">
          <Media src={restaurant.coverUrl} variant="store" />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[rgb(3_18_32/0.7)] via-transparent to-transparent"
          />

          {!restaurant.canOrderNow && (
            <div className="absolute inset-0 grid place-items-center bg-[rgb(0_0_0/0.5)]">
              <span className="rounded-full bg-surface px-4 py-2 font-semibold text-primary">
                {restaurant.isOpenNow ? "Not taking orders right now" : "Closed right now"}
              </span>
            </div>
          )}
        </div>

        <div className="relative z-10 -mt-14 flex flex-col gap-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-5 shadow-card sm:mx-6 sm:p-6 lg:flex-row lg:items-center">
          <span className="size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-surface shadow-card">
            <Media src={restaurant.logoUrl} variant="store" />
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl">{restaurant.name}</h1>
              {restaurant.isFeatured && (
                <BadgeCheck aria-label="Featured restaurant" className="size-5 text-brand" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-secondary">
              {restaurant.ratingCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Star aria-hidden className="size-4 fill-accent-gold text-accent-gold" />
                  <span className="numeric font-bold text-primary">
                    {restaurant.rating.toFixed(1)}
                  </span>
                  <span className="numeric text-muted">({restaurant.ratingCount})</span>
                </span>
              )}
              {restaurant.categories.length > 0 && (
                <span className="truncate">
                  {restaurant.categories.map((category) => category.name).join(" · ")}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="soft" size="sm">
                <Clock aria-hidden className="size-3.5" />
                <span className="numeric">{restaurant.avgPreparationMinutes} min prep</span>
              </Badge>
              {restaurant.minOrderAmount > 0 && (
                <Badge variant="warm" size="sm">
                  <span className="numeric">Min {formatPrice(restaurant.minOrderAmount)}</span>
                </Badge>
              )}
              <Badge variant="outline" size="sm">
                <MapPin aria-hidden className="size-3.5" />
                <span className="truncate">{restaurant.zone.name}</span>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* ── Menu and the order rail ──────────────────────── */}
      <div className="grid items-start gap-8 xl:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <div
            role="tablist"
            aria-label="Restaurant sections"
            className="flex gap-1 border-b border-border-subtle"
          >
            {(["menu", "about"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "relative px-4 py-3 text-sm font-bold capitalize transition-colors",
                  tab === key ? "text-brand" : "text-secondary hover:text-primary",
                  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand after:transition-transform after:content-['']",
                  tab === key ? "after:scale-x-100" : "after:scale-x-0",
                )}
              >
                {key}
              </button>
            ))}
          </div>

          {tab === "about" ? (
            <AboutPanel restaurantId={restaurant.id} restaurant={restaurant} />
          ) : itemsQuery.isPending || menusQuery.isPending ? (
            <MenuGridSkeleton />
          ) : itemsQuery.isError ? (
            <ErrorState error={itemsQuery.error} onRetry={() => void itemsQuery.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              title="This menu is empty"
              description="This restaurant hasn't published any dishes yet."
            />
          ) : (
            <>
              {categoriesWithItems.length > 0 && (
                <div className="no-scrollbar rail -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {[
                    { id: "all", name: "All" },
                    ...categoriesWithItems.map((category) => ({
                      id: category.id,
                      name: category.name,
                    })),
                    ...(ungrouped.length > 0 ? [{ id: "more", name: "More" }] : []),
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setActiveCategory(chip.id)}
                      aria-pressed={activeCategory === chip.id}
                      className={cn(
                        "h-9 shrink-0 rounded-full border px-4 text-sm font-bold transition-all",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                        activeCategory === chip.id
                          ? "border-transparent bg-accent-warm text-white shadow-card dark:text-[#2a1204]"
                          : "border-border-default bg-surface text-secondary hover:border-brand hover:text-brand",
                      )}
                    >
                      {chip.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-10">
                {sections.map((section) => (
                  <section key={section.id} className="flex flex-col gap-4">
                    <h2 className="font-display text-xl font-extrabold text-primary">
                      {section.name}
                    </h2>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {section.items.map((item) => (
                        <DishCard
                          key={item.id}
                          name={item.name}
                          subtitle={item.description ?? undefined}
                          imageUrl={item.imageUrl}
                          price={item.effectivePrice}
                          originalPrice={item.discountedPrice !== null ? item.basePrice : null}
                          rating={item.ratingCount > 0 ? item.rating : undefined}
                          ratingCount={item.ratingCount > 0 ? item.ratingCount : undefined}
                          badge={
                            item.isFeatured ? (
                              <Badge variant="gold" size="sm" className="shadow-card">
                                Popular
                              </Badge>
                            ) : undefined
                          }
                          note={<DishNote item={item} />}
                          adding={pendingItemId === item.id}
                          addLabel={needsChoices(item) ? "Choose" : "Add"}
                          onAdd={() => onAdd(item)}
                          disabledReason={
                            item.isAvailable
                              ? null
                              : (UNAVAILABLE_COPY[item.availabilityReason] ?? "Unavailable")
                          }
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="xl:sticky xl:top-24">
          <RestaurantOrderPanel restaurant={restaurant} />
        </aside>
      </div>

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

/** Address, contact and this week's opening hours, straight from the API. */
function AboutPanel({
  restaurantId,
  restaurant,
}: {
  restaurantId: string;
  restaurant: RestaurantDto;
}) {
  const hoursQuery = useRestaurantHours(restaurantId);

  return (
    <div className="flex flex-col gap-6 rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-6 shadow-card">
      {hasText(restaurant.description) && (
        <p className="max-w-2xl leading-relaxed text-secondary">{restaurant.description}</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="font-display text-base font-extrabold text-primary">Where to find it</h3>
          <p className="flex items-start gap-2 text-sm text-secondary">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>
              {restaurant.addressLine}
              {hasText(restaurant.landmark) && (
                <span className="block text-muted">{formatLandmark(restaurant.landmark)}</span>
              )}
              <span className="block text-muted">
                {restaurant.zone.name}, {restaurant.city.name}
              </span>
            </span>
          </p>
          {hasText(restaurant.phone) && (
            <p className="flex items-center gap-2 text-sm text-secondary">
              <Phone aria-hidden className="size-4 shrink-0 text-brand" />
              <a href={`tel:${restaurant.phone}`} className="numeric hover:text-brand">
                {restaurant.phone}
              </a>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-display text-base font-extrabold text-primary">Opening hours</h3>

          {hoursQuery.isPending ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-4 w-48" />
              ))}
            </div>
          ) : hoursQuery.isError || (hoursQuery.data?.hours.length ?? 0) === 0 ? (
            <p className="text-sm text-muted">This restaurant hasn&apos;t published its hours.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {(hoursQuery.data?.hours ?? []).map((entry) => (
                <li key={entry.dayOfWeek} className="flex items-center justify-between gap-4">
                  <span className="capitalize text-secondary">
                    {entry.dayOfWeek.toLowerCase()}
                  </span>
                  <span className="numeric font-semibold text-primary">
                    {entry.isClosed ? "Closed" : `${entry.opensAt} – ${entry.closesAt}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
