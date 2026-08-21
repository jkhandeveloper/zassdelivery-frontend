"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import * as React from "react";

import { Input, NativeSelect } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRestaurantCategories } from "@/hooks/use-restaurants";
import { BUSINESS_TYPES, BUSINESS_TYPE_ORDER } from "@/lib/business-types";
import { cn } from "@/lib/utils";
import { PriceRange } from "@/types/enums";

export interface RestaurantFilterState {
  search: string;
  category: string;
  /** A `BusinessType`, or "" for every kind of place. */
  businessType: string;
  price: string;
  minRating: string;
  openOnly: boolean;
  sort: string;
}

export const SORT_OPTIONS = [
  { value: "", label: "Recommended" },
  { value: "rating", label: "Rating: high to low" },
  { value: "avgPreparationMinutes", label: "Fastest preparation" },
  { value: "minOrderAmount", label: "Lowest minimum order" },
  { value: "createdAt", label: "Newest first" },
] as const;

const PRICE_OPTIONS = [
  { value: PriceRange.BUDGET, label: "Budget" },
  { value: PriceRange.MODERATE, label: "Moderate" },
  { value: PriceRange.PREMIUM, label: "Premium" },
] as const;

const RATING_OPTIONS = ["4.5", "4", "3.5", "3"] as const;

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2.5 border-t border-border-subtle pt-5 first:border-0 first:pt-0">
      <legend className="pb-2 text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-muted">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

/** A radio row that looks like the reference's filter list rather than an OS radio. */
function RadioRow({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
        "focus-within:ring-2 focus-within:ring-[var(--brand-ring)]",
        checked ? "bg-brand-soft font-bold text-brand" : "text-secondary hover:bg-surface-muted",
      )}
    >
      <input
        type="radio"
        name={name}
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span
        aria-hidden
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-full border-2",
          checked ? "border-brand" : "border-border-strong",
        )}
      >
        {checked && <span className="size-2 rounded-full bg-brand" />}
      </span>
      {children}
    </label>
  );
}

/**
 * The listing's left rail (§5.3): search, cuisine, rating, price, availability
 * and order. Every control writes to the URL through `onChange`, so a filtered
 * view can be shared and survives a back/forward.
 */
export function RestaurantFilters({
  state,
  onChange,
  onClear,
  className,
}: {
  state: RestaurantFilterState;
  onChange: (changes: Record<string, string | null>) => void;
  onClear: () => void;
  className?: string;
}) {
  const categories = useRestaurantCategories({ activeOnly: true });
  const hasFilters =
    state.search !== "" ||
    state.category !== "" ||
    state.businessType !== "" ||
    state.price !== "" ||
    state.minRating !== "" ||
    state.openOnly ||
    state.sort !== "";

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 font-display text-base font-extrabold text-primary">
          <SlidersHorizontal aria-hidden className="size-4 text-brand" />
          Filters
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-accent-warm transition-colors hover:bg-accent-warm-soft"
          >
            <X aria-hidden className="size-3.5" />
            Clear all
          </button>
        )}
      </div>

      <FilterGroup label="Search">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const entered = new FormData(event.currentTarget).get("q");
            onChange({ q: typeof entered === "string" ? entered.trim() : "" });
          }}
        >
          <label htmlFor="filter-search" className="sr-only">
            Search places to order from
          </label>
          {/*
            Uncontrolled, keyed on the committed query: typing stays local to the
            DOM, and the box still resets when the URL changes from elsewhere
            (back button, "clear all") without an effect syncing state behind
            the user's cursor.
          */}
          <Input
            key={state.search}
            id="filter-search"
            name="q"
            type="search"
            defaultValue={state.search}
            placeholder="Search restaurants, bakeries, cafes…"
            leadingIcon={<Search className="size-4" />}
            className="h-11"
          />
        </form>
      </FilterGroup>

      <FilterGroup label="Kind of place">
        <div className="-mx-2 flex flex-col">
          <RadioRow
            name="businessType"
            checked={state.businessType === ""}
            onChange={() => onChange({ type: null })}
          >
            Everything
          </RadioRow>
          {BUSINESS_TYPE_ORDER.map((type) => {
            const { label, icon: Icon } = BUSINESS_TYPES[type];

            return (
              <RadioRow
                key={type}
                name="businessType"
                checked={state.businessType === type}
                onChange={() => onChange({ type })}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                {label}
              </RadioRow>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup label="Cuisines">
        {categories.isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-7 w-full" />
            ))}
          </div>
        ) : (
          <div className="-mx-2 flex max-h-72 flex-col overflow-y-auto">
            <RadioRow
              name="category"
              checked={state.category === ""}
              onChange={() => onChange({ category: null })}
            >
              All cuisines
            </RadioRow>
            {(categories.data?.items ?? []).map((category) => (
              <RadioRow
                key={category.id}
                name="category"
                checked={state.category === category.slug}
                onChange={() => onChange({ category: category.slug })}
              >
                {category.name}
              </RadioRow>
            ))}
          </div>
        )}
      </FilterGroup>

      <FilterGroup label="Rating">
        <div className="-mx-2 flex flex-col">
          <RadioRow
            name="rating"
            checked={state.minRating === ""}
            onChange={() => onChange({ rating: null })}
          >
            Any rating
          </RadioRow>
          {RATING_OPTIONS.map((value) => (
            <RadioRow
              key={value}
              name="rating"
              checked={state.minRating === value}
              onChange={() => onChange({ rating: value })}
            >
              <span className="numeric">{value} &amp; above</span>
            </RadioRow>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Price range">
        <div className="-mx-2 flex flex-col">
          <RadioRow
            name="price"
            checked={state.price === ""}
            onChange={() => onChange({ price: null })}
          >
            Any price
          </RadioRow>
          {PRICE_OPTIONS.map((option) => (
            <RadioRow
              key={option.value}
              name="price"
              checked={state.price === option.value}
              onChange={() => onChange({ price: option.value })}
            >
              {option.label}
            </RadioRow>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Availability">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-muted px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-brand focus-within:ring-4 focus-within:ring-[var(--brand-ring)]">
          Open now
          <input
            type="checkbox"
            className="sr-only"
            checked={state.openOnly}
            onChange={() => onChange({ open: state.openOnly ? null : "1" })}
          />
          <span
            aria-hidden
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              state.openOnly ? "bg-brand" : "bg-border-strong",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white transition-all duration-200",
                state.openOnly ? "left-[1.375rem]" : "left-0.5",
              )}
            />
          </span>
        </label>
      </FilterGroup>

      <FilterGroup label="Sort by">
        <label htmlFor="filter-sort" className="sr-only">
          Sort results
        </label>
        <NativeSelect
          id="filter-sort"
          className="h-11"
          value={state.sort}
          onChange={(event) => onChange({ sort: event.target.value })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </FilterGroup>
    </div>
  );
}
