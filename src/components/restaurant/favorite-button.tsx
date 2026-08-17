"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { useFavorites, useToggleFavoriteRestaurant } from "@/hooks/use-users";
import { cn } from "@/lib/utils";

/**
 * The heart on a restaurant tile.
 *
 * Cards are links, so the click has to be stopped before it navigates. Signed
 * out, the heart still shows — it sends you to sign in rather than pretending
 * to save something that would be lost.
 */
export function FavoriteButton({
  restaurantId,
  name,
  className,
}: {
  restaurantId: string;
  name: string;
  className?: string;
}) {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  const favorites = useFavorites(
    { target: "restaurant", limit: 100 },
    isReady && isAuthenticated,
  );
  const toggle = useToggleFavoriteRestaurant();

  const saved =
    favorites.data?.items.some((favorite) => favorite.item.id === restaurantId) ?? false;

  const onClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      await toggle.mutateAsync({ restaurantId, saved });
      toast.success(saved ? `${name} removed from favourites` : `${name} saved to favourites`);
    } catch {
      toast.error("We couldn't update your favourites. Please try again.");
    }
  };

  return (
    <button
      type="button"
      onClick={(event) => void onClick(event)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from favourites` : `Save ${name} to favourites`}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-surface/90 text-secondary shadow-card backdrop-blur",
        "transition-all duration-200 hover:scale-110 hover:text-danger",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        "motion-reduce:transform-none motion-reduce:transition-none",
        toggle.isPending && "animate-pulse",
        className,
      )}
    >
      <Heart className={cn("size-4.5", saved && "fill-danger text-danger")} />
    </button>
  );
}
