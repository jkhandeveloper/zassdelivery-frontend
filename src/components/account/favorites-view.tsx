"use client";

import { Heart, HeartOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { RestaurantCardSkeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useFavorites, useToggleFavoriteRestaurant } from "@/hooks/use-users";

/**
 * Saved restaurants.
 *
 * A favourite carries the restaurant's id and name but not its slug, and the
 * storefront route is keyed by slug — so opening one searches by name rather
 * than building a URL that would 404.
 */
export function FavoritesView() {
  const { isAuthenticated, isReady } = useAuth();
  const signedIn = isReady && isAuthenticated;

  const favorites = useFavorites({ target: "restaurant", limit: 50 }, signedIn);
  const toggle = useToggleFavoriteRestaurant();

  if (isReady && !isAuthenticated) {
    return (
      <EmptyState
        icon={<Heart className="size-8" />}
        title="Sign in to see your favourites"
        description="Save the kitchens you order from most and they'll be one tap away."
        action={
          <Button asChild>
            <Link href="/login?next=%2Ffavorites">Sign in</Link>
          </Button>
        }
      />
    );
  }

  if (!isReady || favorites.isPending) {
    return (
      <SkeletonRegion
        label="Loading your favourites"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <RestaurantCardSkeleton key={index} />
        ))}
      </SkeletonRegion>
    );
  }

  if (favorites.isError) {
    return <ErrorState error={favorites.error} onRetry={() => void favorites.refetch()} />;
  }

  const items = favorites.data.items;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="size-8" />}
        title="Nothing saved yet"
        description="Tap the heart on any restaurant and it will show up here."
        action={
          <Button asChild>
            <Link href="/restaurants">Browse restaurants</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((favorite) => (
        <li
          key={favorite.id}
          className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-glow motion-reduce:transform-none"
        >
          <div className="aspect-[16/10] overflow-hidden bg-surface-muted">
            <Media
              src={favorite.item.imageUrl}
              variant="store"
              imgClassName="transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
            />
          </div>

          <div className="flex flex-1 flex-col gap-3 p-4">
            <h2 className="font-display text-base font-extrabold text-primary">
              <Link
                href={`/restaurants?q=${encodeURIComponent(favorite.item.name)}`}
                className="hover:text-brand"
              >
                {favorite.item.name}
              </Link>
            </h2>

            <Button
              variant="ghost"
              size="sm"
              className="mt-auto self-start text-danger hover:bg-danger-soft"
              loading={toggle.isPending && toggle.variables?.restaurantId === favorite.item.id}
              onClick={() =>
                toggle.mutate(
                  { restaurantId: favorite.item.id, saved: true },
                  {
                    onSuccess: () => toast.success(`${favorite.item.name} removed`),
                    onError: () => toast.error("We couldn't update your favourites."),
                  },
                )
              }
            >
              <HeartOff className="size-4" />
              Remove
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
