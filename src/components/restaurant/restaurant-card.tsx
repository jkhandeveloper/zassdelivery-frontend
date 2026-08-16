"use client";

import { Clock, MapPin } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/status-pill";
import { Rating } from "@/components/ui/rating";
import { cn, formatPrice } from "@/lib/utils";
import type { RestaurantDto } from "@/types/restaurant";

/** Distance is metres from the API; kilometres is what people think in. */
function formatDistance(metres: number): string {
  return metres < 950 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;
}

/**
 * Seed and real data both leave logoUrl/coverUrl null often enough that the
 * fallback is the common case, not the exception — so it is designed, not a
 * grey box: the restaurant's initial over a tint derived from its own name, so
 * two cards side by side never look identical.
 */
function CoverFallback({ name }: { name: string }) {
  const hue = React.useMemo(() => {
    let sum = 0;
    for (let i = 0; i < name.length; i += 1) sum = (sum + name.charCodeAt(i) * 17) % 360;
    return sum;
  }, [name]);

  return (
    <div
      aria-hidden
      className="grid size-full place-items-center"
      style={{
        background: `linear-gradient(135deg, oklch(0.72 0.13 ${hue}) 0%, oklch(0.58 0.16 ${(hue + 40) % 360}) 100%)`,
      }}
    >
      <span className="font-display text-4xl font-extrabold text-white/90">{name.charAt(0)}</span>
    </div>
  );
}

export function RestaurantCard({ restaurant }: { restaurant: RestaurantDto }) {
  const { name, slug, coverUrl, logoUrl, categories, rating, ratingCount, minOrderAmount, avgPreparationMinutes, canOrderNow, isOpenNow, opensInMinutes, isFeatured, distanceMeters } = restaurant;

  // Open but not accepting orders is a real state — the kitchen has paused.
  const closedReason = canOrderNow
    ? null
    : isOpenNow
      ? "Not taking orders"
      : typeof opensInMinutes === "number" && opensInMinutes > 0
        ? `Opens in ${opensInMinutes} min`
        : "Closed";

  return (
    <Link
      href={`/restaurants/${slug}`}
      className="group block rounded-[var(--radius-card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <article
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface shadow-card",
          "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "group-hover:-translate-y-1 group-hover:border-border-default group-hover:shadow-card-hover",
          "motion-reduce:transform-none motion-reduce:transition-none",
        )}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
          {coverUrl != null && coverUrl !== "" ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote hosts are not known ahead of time, so next/image would need an open remotePatterns
            <img
              src={coverUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
            />
          ) : (
            <CoverFallback name={name} />
          )}

          {isFeatured && (
            <div className="absolute left-3 top-3">
              <Badge variant="gold">Featured</Badge>
            </div>
          )}

          {closedReason !== null && (
            <div className="absolute inset-0 grid place-items-center bg-[rgb(0_0_0/0.55)] backdrop-blur-[1px]">
              <span className="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-primary">
                {closedReason}
              </span>
            </div>
          )}

          {logoUrl != null && logoUrl !== "" && (
            // eslint-disable-next-line @next/next/no-img-element -- see above
            <img
              src={logoUrl}
              alt=""
              loading="lazy"
              className="absolute bottom-3 left-3 size-12 rounded-xl border-2 border-surface object-cover shadow-card"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-base font-extrabold leading-tight text-primary">{name}</h3>
            {ratingCount > 0 && <Rating value={rating} count={ratingCount} size="sm" compact />}
          </div>

          {categories.length > 0 && (
            <p className="line-clamp-1 text-sm text-secondary">
              {categories.map((category) => category.name).join(" · ")}
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm text-muted">
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
            {minOrderAmount > 0 && (
              <span className="numeric">Min {formatPrice(minOrderAmount)}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
