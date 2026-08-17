"use client";

import { Loader2, Plus, Star } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Media } from "@/components/ui/media";
import { Badge } from "@/components/ui/status-pill";
import { cn, formatPrice } from "@/lib/utils";

/**
 * A dish tile: photo, name, where it comes from, price, and one way to add it.
 *
 * Presentational on purpose — the home rails hand it a search hit and the menu
 * grid hands it a menu item, and neither shape leaks in here.
 */
export function DishCard({
  name,
  subtitle,
  imageUrl,
  price,
  originalPrice,
  rating,
  ratingCount,
  badge,
  href,
  note,
  onAdd,
  adding = false,
  addLabel = "Add",
  disabledReason,
  className,
}: {
  name: string;
  subtitle?: string;
  imageUrl?: string | null;
  price: number;
  /** Shown struck through when the dish is discounted. */
  originalPrice?: number | null;
  rating?: number;
  ratingCount?: number;
  badge?: ReactNode;
  /** Makes the tile's image and title a link — the menu grid uses this. */
  href?: string;
  /** A line under the price: prep time, stock warning, spice level. */
  note?: ReactNode;
  onAdd?: () => void;
  adding?: boolean;
  addLabel?: string;
  /** When set, the tile reads as unorderable and the button is replaced. */
  disabledReason?: string | null;
  className?: string;
}) {
  const discounted =
    originalPrice !== null && originalPrice !== undefined && originalPrice > price;
  const unavailable = disabledReason !== null && disabledReason !== undefined;

  const media = (
    <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
      <Media
        src={imageUrl}
        imgClassName="transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
      />

      {badge !== undefined && <div className="absolute left-3 top-3">{badge}</div>}

      {discounted && (
        <div className="absolute right-3 top-3">
          <Badge variant="warm" size="sm" className="shadow-card">
            {Math.round(((originalPrice - price) / originalPrice) * 100)}% off
          </Badge>
        </div>
      )}

      {unavailable && (
        <div className="absolute inset-0 grid place-items-center bg-[rgb(0_0_0/0.55)] backdrop-blur-[1px]">
          <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-primary">
            {disabledReason}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface shadow-card",
        "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-1 hover:border-brand/40 hover:shadow-glow",
        "motion-reduce:transform-none motion-reduce:transition-none",
        unavailable && "opacity-75",
        className,
      )}
    >
      {href === undefined ? (
        media
      ) : (
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden
          className="block focus-visible:outline-none"
        >
          {media}
        </Link>
      )}

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-display text-[0.9375rem] font-extrabold leading-snug text-primary">
          {href === undefined ? (
            name
          ) : (
            <Link
              href={href}
              className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {name}
            </Link>
          )}
        </h3>

        {subtitle !== undefined && subtitle !== "" && (
          <p className="truncate text-xs text-muted">{subtitle}</p>
        )}

        {note !== undefined && <div className="pt-0.5 text-xs text-secondary">{note}</div>}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="numeric font-display text-base font-extrabold text-primary">
                {formatPrice(price)}
              </span>
              {discounted && (
                <span className="numeric text-xs text-muted line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>

            {rating !== undefined && rating > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                <Star aria-hidden className="size-3.5 fill-accent-gold text-accent-gold" />
                <span className="numeric">{rating.toFixed(1)}</span>
                {ratingCount !== undefined && ratingCount > 0 && (
                  <span className="numeric font-normal text-muted">({ratingCount})</span>
                )}
              </span>
            )}
          </div>

          {onAdd !== undefined && !unavailable && (
            <button
              type="button"
              onClick={onAdd}
              disabled={adding}
              aria-label={`${addLabel} ${name}`}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-warm px-3.5 py-2 text-xs font-bold text-white shadow-card",
                "transition-all duration-200 hover:shadow-glow-warm hover:brightness-105 active:scale-95",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                "disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none",
                "dark:text-[#2a1204]",
              )}
            >
              {adding ? (
                <Loader2 aria-hidden className="size-3.5 animate-spin" />
              ) : (
                <Plus aria-hidden className="size-3.5" />
              )}
              {addLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
