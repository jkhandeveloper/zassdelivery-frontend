"use client";

import Link from "next/link";

import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { RestaurantCardSkeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { useRestaurants } from "@/hooks/use-restaurants";

/**
 * A row of restaurants, scrolled sideways on small screens and laid out as a
 * grid from lg up — the same cards the /restaurants listing uses, so a kitchen
 * looks identical wherever it turns up.
 */
export function RestaurantRail({
  title,
  description,
  query,
  viewAllHref = "/restaurants",
  emptyTitle = "Nothing here yet",
  emptyDescription = "We're still signing up kitchens in your area. Check back soon.",
}: {
  title: string;
  description?: string;
  query?: Parameters<typeof useRestaurants>[0];
  viewAllHref?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const { data, isPending, isError } = useRestaurants({ limit: 8, ...query });
  const restaurants = data?.items ?? [];

  return (
    <section className="flex flex-col gap-5">
      <SectionHeader title={title} description={description} viewAllHref={viewAllHref} />

      {isPending ? (
        <SkeletonRegion
          label={`Loading ${title.toLowerCase()}`}
          className="grid grid-cols-2 gap-5 lg:grid-cols-4"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <RestaurantCardSkeleton key={index} />
          ))}
        </SkeletonRegion>
      ) : isError || restaurants.length === 0 ? (
        <EmptyState
          density="inline"
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button variant="outline" asChild>
              <Link href="/restaurants">Browse everywhere</Link>
            </Button>
          }
        />
      ) : (
        <div className="no-scrollbar rail -mx-5 flex gap-5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {restaurants.slice(0, 8).map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              className="w-[17rem] shrink-0 lg:w-auto"
            />
          ))}
        </div>
      )}
    </section>
  );
}
