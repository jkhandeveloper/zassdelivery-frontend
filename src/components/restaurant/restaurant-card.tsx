"use client";

import { BadgeCheck, Clock, MapPin } from "lucide-react";
import Link from "next/link";

import { FavoriteButton } from "@/components/restaurant/favorite-button";
import { Media } from "@/components/ui/media";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/status-pill";
import { BUSINESS_TYPES, businessTypeLabel } from "@/lib/business-types";
import { cn, formatPrice, hasText } from "@/lib/utils";
import type { RestaurantDto } from "@/types/restaurant";

/** Distance is metres from the API; kilometres is what people think in. */
function formatDistance(metres: number): string {
  return metres < 950 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;
}

export function RestaurantCard({
  restaurant,
  className,
}: {
  restaurant: RestaurantDto;
  className?: string;
}) {
  const {
    id,
    name,
    slug,
    coverUrl,
    logoUrl,
    categories,
    rating,
    ratingCount,
    minOrderAmount,
    avgPreparationMinutes,
    canOrderNow,
    isOpenNow,
    opensInMinutes,
    isFeatured,
    distanceMeters,
    businessType,
  } = restaurant;

  // Open but not accepting orders is a real state — the kitchen has paused.
  const closedReason = canOrderNow
    ? null
    : isOpenNow
      ? "Not taking orders"
      : typeof opensInMinutes === "number" && opensInMinutes > 0
        ? `Opens in ${opensInMinutes} min`
        : "Closed";

  const TypeIcon = (BUSINESS_TYPES[businessType] ?? BUSINESS_TYPES.RESTAURANT).icon;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface shadow-card",
        "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        // Lift into a cyan bloom rather than a heavier grey shadow.
        "hover:-translate-y-1 hover:border-brand/40 hover:shadow-glow",
        "motion-reduce:transform-none motion-reduce:transition-none",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
        <Media
          src={coverUrl}
          variant="store"
          imgClassName="transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
        />

        {isFeatured && (
          <div className="absolute left-3 top-3">
            <Badge variant="gold" size="sm" className="shadow-card">
              <BadgeCheck aria-hidden className="size-3.5" />
              Featured
            </Badge>
          </div>
        )}

        {/* Sits above the card-wide link so the heart is clickable on its own. */}
        <FavoriteButton restaurantId={id} name={name} className="absolute right-3 top-3 z-20" />

        {closedReason !== null && (
          <div className="absolute inset-0 grid place-items-center bg-[rgb(0_0_0/0.55)] backdrop-blur-[1px]">
            <span className="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-primary">
              {closedReason}
            </span>
          </div>
        )}

        {hasText(logoUrl) && (
          <span className="absolute bottom-3 left-3 size-11 overflow-hidden rounded-xl border-2 border-surface shadow-card">
            <Media src={logoUrl} variant="store" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-base font-extrabold leading-tight text-primary">
          {/* The whole card is the hit area; the anchor is stretched over it. */}
          <Link
            href={`/restaurants/${slug}`}
            className="after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-brand"
          >
            {name}
          </Link>
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          {/*
            Shown on every card, restaurants included: the platform lists
            bakeries, cafes and shops too, and labelling only the non-restaurants
            would read as though a restaurant were the normal case and the rest
            an exception.
          */}
          <span className="inline-flex items-center gap-1 font-semibold text-secondary">
            <TypeIcon aria-hidden className="size-3.5" />
            {businessTypeLabel(businessType)}
          </span>
          {ratingCount > 0 && <Rating value={rating} count={ratingCount} size="sm" compact />}
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden className="size-3.5" />
            <span className="numeric">{avgPreparationMinutes} min</span>
          </span>
          {typeof distanceMeters === "number" && (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="size-3.5" />
              <span className="numeric">{formatDistance(distanceMeters)}</span>
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          {categories.slice(0, 2).map((category, index) => (
            <Badge key={category.id} size="sm" variant={index % 2 === 0 ? "warm" : "soft"}>
              {category.name}
            </Badge>
          ))}
          {minOrderAmount > 0 && (
            <span className="numeric ml-auto text-xs font-semibold text-secondary">
              Min {formatPrice(minOrderAmount)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
