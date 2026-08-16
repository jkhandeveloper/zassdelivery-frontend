"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { RestaurantGridSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useRestaurantCategories, useRestaurants } from "@/hooks/use-restaurants";
import { cn } from "@/lib/utils";
import { PriceRange } from "@/types/enums";

const PAGE_SIZE = 12;

const PRICE_LABELS: Record<string, string> = {
  [PriceRange.BUDGET]: "Budget",
  [PriceRange.MODERATE]: "Moderate",
  [PriceRange.PREMIUM]: "Premium",
};

export function RestaurantBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The URL is the source of truth for filters, so a filtered view can be
  // shared, bookmarked and survives a back/forward.
  const search = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const priceRange = searchParams.get("price") ?? "";
  const openOnly = searchParams.get("open") === "1";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);

  const setParams = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }

      // Any filter change invalidates the current page number.
      if (!("page" in changes)) next.delete("page");

      const query = next.toString();
      router.replace(query === "" ? "/restaurants" : `/restaurants?${query}`, { scroll: false });
    },
    [router, searchParams],
  );

  const categoriesQuery = useRestaurantCategories();

  const { data, isPending, isError, error, refetch, isFetching } = useRestaurants({
    page,
    limit: PAGE_SIZE,
    ...(search !== "" && { search }),
    ...(category !== "" && { category }),
    ...(priceRange !== "" && { priceRange }),
    ...(openOnly && { acceptingOnly: true }),
  });

  const hasFilters = search !== "" || category !== "" || priceRange !== "" || openOnly;

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const entered = new FormData(event.currentTarget).get("q");
          setParams({ q: typeof entered === "string" ? entered.trim() : "" });
        }}
        className="flex flex-col gap-3 sm:flex-row"
        role="search"
      >
        <div className="flex-1">
          <label htmlFor="restaurant-search" className="sr-only">
            Search restaurants
          </label>
          {/*
            Uncontrolled, keyed on the committed query: typing stays local to
            the DOM, and the box still resets when the URL changes from
            elsewhere (back button, "clear filters") without an effect syncing
            state behind the user's cursor.
          */}
          <Input
            key={search}
            id="restaurant-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Search restaurants or a dish…"
            leadingIcon={<Search className="size-4" />}
          />
        </div>
        <Button type="submit" size="lg" className="sm:w-auto">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary">
          <SlidersHorizontal aria-hidden className="size-4" />
          Filters
        </span>

        <div className="min-w-[10rem]">
          <label htmlFor="filter-category" className="sr-only">
            Cuisine
          </label>
          <NativeSelect
            id="filter-category"
            className="h-10"
            value={category}
            onChange={(event) => setParams({ category: event.target.value })}
          >
            <option value="">All cuisines</option>
            {(categoriesQuery.data?.items ?? []).map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="min-w-[9rem]">
          <label htmlFor="filter-price" className="sr-only">
            Price range
          </label>
          <NativeSelect
            id="filter-price"
            className="h-10"
            value={priceRange}
            onChange={(event) => setParams({ price: event.target.value })}
          >
            <option value="">Any price</option>
            {Object.entries(PRICE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <button
          type="button"
          onClick={() => setParams({ open: openOnly ? null : "1" })}
          aria-pressed={openOnly}
          className={cn(
            "h-10 rounded-[var(--radius-input)] border px-4 text-sm font-semibold transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
            openOnly
              ? "border-brand bg-brand-soft text-brand"
              : "border-border-default bg-surface-muted text-secondary hover:border-brand",
          )}
        >
          Open now
        </button>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.replace("/restaurants", { scroll: false })}
          >
            <X className="size-4" />
            Clear
          </Button>
        )}

        {data !== undefined && (
          <span className="ml-auto numeric text-sm text-muted" aria-live="polite">
            {data.meta.total} {data.meta.total === 1 ? "restaurant" : "restaurants"}
          </span>
        )}
      </div>

      {isPending ? (
        <RestaurantGridSkeleton />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No restaurants match those filters" : "No restaurants here yet"}
          description={
            hasFilters
              ? "Try widening your search — fewer filters, or a different cuisine."
              : "We're still signing up kitchens in your area. Check back soon."
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={() => router.replace("/restaurants", { scroll: false })}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div
            className={cn(
              "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
              // Dim while refetching so it is obvious the list is going stale,
              // without tearing it down and losing scroll position.
              isFetching && "opacity-60 transition-opacity",
            )}
          >
            {data.items.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-4 pt-2" aria-label="Pagination">
              <Button
                variant="outline"
                disabled={!data.meta.hasPreviousPage}
                onClick={() => setParams({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <span className="numeric text-sm text-secondary">
                Page {data.meta.page} of {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!data.meta.hasNextPage}
                onClick={() => setParams({ page: String(page + 1) })}
              >
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
