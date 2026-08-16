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

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-PK").format(value);
}
