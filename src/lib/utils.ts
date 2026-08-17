import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional classes, letting later Tailwind utilities win. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const PKR = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

/** Prices, always tabular — pair with the `numeric` class where digits stack. */
export function formatPrice(amount: number): string {
  return PKR.format(amount);
}

/**
 * True when a string is actually worth rendering.
 *
 * The API sends `null` for every empty optional string, so `!== undefined` is
 * not the test it looks like — it passes a null straight through to an <img
 * src> or a paragraph. Everything that renders an optional string goes
 * through here.
 */
export function hasText(value: string | null | undefined): value is string {
  return value !== null && value !== undefined && value.trim() !== "";
}

/**
 * A landmark, without the doubled preposition.
 *
 * Seed and customer-entered landmarks often already start with "near", so
 * prefixing blindly produces "Near Near Pabbi Bus Stand".
 */
export function formatLandmark(landmark: string): string {
  return /^near\b/i.test(landmark.trim()) ? landmark.trim() : `Near ${landmark.trim()}`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-PK").format(value);
}
