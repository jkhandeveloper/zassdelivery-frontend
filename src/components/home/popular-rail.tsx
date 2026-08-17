"use client";

import { DishCard } from "@/components/restaurant/dish-card";
import { SectionHeader } from "@/components/ui/section-header";
import { FoodCardSkeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { useQuickAdd } from "@/hooks/use-quick-add";
import { usePopularDishes } from "@/hooks/use-search";

/**
 * The dishes people are actually ordering, from GET /search/popular.
 *
 * Adding straight from a tile only works for a dish with no required choices;
 * the hit does not carry its variants, so anything the API rejects sends the
 * customer to the item on its restaurant page rather than guessing for them.
 */
export function PopularRail({
  title = "Popular near you",
  description,
  limit = 8,
}: {
  title?: string;
  description?: string;
  limit?: number;
}) {
  const { data, isPending, isError } = usePopularDishes({ limit });
  const { add, pendingItemId } = useQuickAdd();

  const dishes = data?.items ?? [];

  if (isPending) {
    return (
      <section className="flex flex-col gap-5">
        <SectionHeader title={title} description={description} viewAllHref="/restaurants" />
        <SkeletonRegion
          label="Loading popular dishes"
          className="grid grid-cols-2 gap-5 lg:grid-cols-4"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <FoodCardSkeleton key={index} />
          ))}
        </SkeletonRegion>
      </section>
    );
  }

  // Popular dishes are a discovery aid, not the page: if the index is empty or
  // the call fails, drop the rail rather than showing an error where a row of
  // food should be.
  if (isError || dishes.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-5">
      <SectionHeader title={title} description={description} viewAllHref="/restaurants" />

      <div className="no-scrollbar rail -mx-5 flex gap-5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {dishes.map((dish) => (
          <DishCard
            key={dish.id}
            className="w-[15rem] shrink-0 lg:w-auto"
            name={dish.name}
            subtitle={dish.restaurantName}
            href={`/restaurants/${dish.restaurantSlug}`}
            imageUrl={dish.imageUrl}
            price={dish.effectivePrice}
            rating={dish.rating}
            ratingCount={dish.ratingCount}
            adding={pendingItemId === dish.id}
            onAdd={() => void add({ menuItemId: dish.id, name: dish.name })}
          />
        ))}
      </div>
    </section>
  );
}
