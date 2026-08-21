"use client";

import {
  Beef,
  CakeSlice,
  Coffee,
  Croissant,
  CupSoda,
  Drumstick,
  EggFried,
  Fish,
  Flame,
  LayoutGrid,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Media } from "@/components/ui/media";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { useRestaurantCategories } from "@/hooks/use-restaurants";
import { cn, hasText } from "@/lib/utils";

/**
 * An icon for the cuisines we know by name, so a category with no iconUrl —
 * which is most of them in practice — still reads at a glance.
 *
 * Drawn icons rather than emoji on purpose: emoji depend on a font the visitor
 * may not have, and a row of tofu boxes is worse than no icon at all.
 */
const CUISINE_ICONS: Record<string, ReactNode> = {
  pizza: <Pizza className="size-5" />,
  burger: <Sandwich className="size-5" />,
  burgers: <Sandwich className="size-5" />,
  sandwiches: <Sandwich className="size-5" />,
  biryani: <Soup className="size-5" />,
  pulao: <Soup className="size-5" />,
  karahi: <Soup className="size-5" />,
  bbq: <Flame className="size-5" />,
  barbecue: <Flame className="size-5" />,
  desi: <Drumstick className="size-5" />,
  "fast-food": <Beef className="size-5" />,
  fastfood: <Beef className="size-5" />,
  desserts: <CakeSlice className="size-5" />,
  dessert: <CakeSlice className="size-5" />,
  bakery: <Croissant className="size-5" />,
  drinks: <CupSoda className="size-5" />,
  beverages: <CupSoda className="size-5" />,
  coffee: <Coffee className="size-5" />,
  breakfast: <EggFried className="size-5" />,
  healthy: <Salad className="size-5" />,
  seafood: <Fish className="size-5" />,
  chinese: <Wheat className="size-5" />,
  continental: <Salad className="size-5" />,
  "chai-coffee": <Coffee className="size-5" />,
  chai: <Coffee className="size-5" />,
};

function iconFor(slug: string, name: string): ReactNode {
  return (
    CUISINE_ICONS[slug] ??
    CUISINE_ICONS[name.toLowerCase()] ?? <UtensilsCrossed className="size-5" />
  );
}

const TILE =
  "group flex min-h-[7.5rem] w-28 shrink-0 flex-col items-center gap-2 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 shadow-card transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-brand/40 hover:shadow-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transform-none motion-reduce:transition-none";

export function CategoryStrip() {
  const { data, isPending, isError } = useRestaurantCategories({ activeOnly: true });

  if (isPending) {
    return (
      <SkeletonRegion label="Loading cuisines" className="no-scrollbar flex gap-3 overflow-x-auto">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-28 shrink-0 rounded-[var(--radius-card)]" />
        ))}
      </SkeletonRegion>
    );
  }

  // A cuisine strip is garnish on the storefront: if it fails or comes back
  // empty, the page below it is still the point — say nothing and move on.
  const categories = data?.items ?? [];
  if (isError || categories.length === 0) {
    return null;
  }

  return (
    <div className="no-scrollbar rail -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
      {categories.slice(0, 11).map((category) => (
        <Link
          key={category.id}
          href={`/restaurants?category=${encodeURIComponent(category.slug)}`}
          className={TILE}
        >
          <span className="grid size-12 place-items-center overflow-hidden rounded-2xl bg-brand-soft text-brand transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none">
            {hasText(category.iconUrl) ? (
              <Media src={category.iconUrl} className="rounded-2xl" />
            ) : (
              iconFor(category.slug, category.name)
            )}
          </span>
          <span className="line-clamp-2 text-balance text-center text-xs font-bold leading-snug text-primary">
            {category.name}
          </span>
        </Link>
      ))}

      <Link href="/restaurants" className={cn(TILE, "border-dashed")}>
        <span className="grid size-12 place-items-center rounded-2xl bg-surface-muted text-secondary">
          <LayoutGrid aria-hidden className="size-5" />
        </span>
        <span className="text-center text-xs font-bold text-primary">More</span>
      </Link>
    </div>
  );
}
