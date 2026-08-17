"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Every food, cover, logo and avatar image in the product goes through here.
 *
 * Seed and live data both leave imageUrl/coverUrl null often enough that the
 * fallback is the common case, not the exception — so a missing image gets the
 * same designed placeholder everywhere rather than a per-component invention,
 * and a remote URL that 404s falls back to it too instead of leaving a broken
 * frame behind.
 */
const PLACEHOLDERS = {
  food: "/images/placeholder-food.svg",
  store: "/images/placeholder-store.svg",
} as const;

export interface MediaProps {
  src?: string | null;
  /** Empty by default: these images sit beside a heading that already names the thing. */
  alt?: string;
  /** Which stand-in to use when there is nothing to show. */
  variant?: keyof typeof PLACEHOLDERS;
  className?: string;
  /** Applied to the real image only, so a hover zoom never scales the placeholder. */
  imgClassName?: string;
  fallbackClassName?: string;
}

export function Media({
  src,
  alt = "",
  variant = "food",
  className,
  imgClassName,
  fallbackClassName,
}: MediaProps) {
  // The *url* that failed is remembered rather than a boolean, so a tile handed
  // a new src tries again on its own — no effect resetting a flag behind it.
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const usable = src !== null && src !== undefined && src !== "" && failedSrc !== src;

  if (!usable) {
    return (
      <span
        aria-hidden
        className={cn(
          "grid size-full place-items-center bg-surface-muted",
          className,
          fallbackClassName,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG in /public; next/image would add a loader round trip for no gain */}
        <img
          src={PLACEHOLDERS[variant]}
          alt=""
          // Sized off the box but clamped at both ends: the same drawing has to
          // stay legible in a 40px logo tile and stay a mark — not a mural — on
          // a full-width cover.
          className="h-[45%] max-h-20 min-h-5 w-auto object-contain"
        />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote hosts are open-ended, so next/image would need unrestricted remotePatterns
    <img
      src={src as string}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src as string)}
      className={cn("size-full object-cover", className, imgClassName)}
    />
  );
}
