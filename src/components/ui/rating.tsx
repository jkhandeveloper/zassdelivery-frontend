"use client";

import { Star } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface RatingProps {
  /** 0–5. Rendered to one decimal beside the stars. */
  value: number;
  /** How many ratings the average is built from, when the API supplies it. */
  count?: number;
  size?: "sm" | "md" | "lg";
  /** A single star plus the number — for dense cards where five stars is noise. */
  compact?: boolean;
  className?: string;
}

const sizes = {
  sm: { star: "size-3.5", text: "text-xs" },
  md: { star: "size-4", text: "text-sm" },
  lg: { star: "size-5", text: "text-base" },
} as const;

export function Rating({ value, count, size = "md", compact = false, className }: RatingProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const dimension = sizes[size];
  const label =
    count === undefined
      ? `Rated ${clamped.toFixed(1)} out of 5`
      : `Rated ${clamped.toFixed(1)} out of 5, from ${count} ratings`;

  if (compact) {
    return (
      <span
        className={cn("inline-flex items-center gap-1 font-semibold", dimension.text, className)}
        aria-label={label}
      >
        <Star aria-hidden className={cn(dimension.star, "fill-accent-gold text-accent-gold")} />
        <span className="numeric">{clamped.toFixed(1)}</span>
        {count !== undefined && (
          <span className="numeric font-normal text-muted">({count})</span>
        )}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} aria-label={label}>
      <span aria-hidden className="relative inline-flex">
        {/* Empty track, then a clipped filled copy — gives real half stars
            without five separate fractional calculations. */}
        <span className="inline-flex gap-0.5">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} className={cn(dimension.star, "text-border-strong")} />
          ))}
        </span>
        <span
          className="absolute inset-0 inline-flex gap-0.5 overflow-hidden"
          style={{ width: `${(clamped / 5) * 100}%` }}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={cn(dimension.star, "shrink-0 fill-accent-gold text-accent-gold")}
            />
          ))}
        </span>
      </span>
      <span className={cn("numeric font-semibold", dimension.text)}>{clamped.toFixed(1)}</span>
      {count !== undefined && (
        <span className={cn("numeric text-muted", dimension.text)}>({count})</span>
      )}
    </span>
  );
}
