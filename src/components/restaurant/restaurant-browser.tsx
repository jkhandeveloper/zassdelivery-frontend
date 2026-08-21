"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import {
  RestaurantFilters,
  type RestaurantFilterState,
} from "@/components/restaurant/restaurant-filters";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { RestaurantGridSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useRestaurants } from "@/hooks/use-restaurants";
import { businessTypeCountNoun } from "@/lib/business-types";
import { cn } from "@/lib/utils";
import type { BusinessType } from "@/types/enums";

const PAGE_SIZE = 12;

/** The chips above the grid — the filters people reach for without opening the rail. */
const QUICK_FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open now" },
  { key: "top", label: "Top rated" },
  { key: "fast", label: "Fastest prep" },
] as const;

export function RestaurantBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The URL is the source of truth for filters, so a filtered view can be
  // shared, bookmarked and survives a back/forward.
  const state: RestaurantFilterState = {
    search: searchParams.get("q") ?? "",
    category: searchParams.get("category") ?? "",
    businessType: searchParams.get("type") ?? "",
    price: searchParams.get("price") ?? "",
    minRating: searchParams.get("rating") ?? "",
    openOnly: searchParams.get("open") === "1",
    sort: searchParams.get("sort") ?? "",
  };
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

  const clearAll = React.useCallback(
    () => router.replace("/restaurants", { scroll: false }),
    [router],
  );

  const activeQuick =
    state.openOnly && state.sort === ""
      ? "open"
      : state.sort === "rating"
        ? "top"
        : state.sort === "avgPreparationMinutes"
          ? "fast"
          : state.openOnly
            ? "open"
            : "all";

  const applyQuick = (key: (typeof QUICK_FILTERS)[number]["key"]) => {
    switch (key) {
      case "open":
        return setParams({ open: "1", sort: null });
      case "top":
        return setParams({ sort: "rating", open: null });
      case "fast":
        return setParams({ sort: "avgPreparationMinutes", open: null });
      default:
        return setParams({ open: null, sort: null });
    }
  };

  const { data, isPending, isError, error, refetch, isFetching } = useRestaurants({
    page,
    limit: PAGE_SIZE,
    ...(state.search !== "" && { search: state.search }),
    ...(state.category !== "" && { category: state.category }),
    ...(state.businessType !== "" && { businessType: state.businessType as BusinessType }),
    ...(state.price !== "" && { priceRange: state.price }),
    ...(state.minRating !== "" && { minRating: Number(state.minRating) }),
    ...(state.openOnly && { acceptingOnly: true }),
    ...(state.sort !== "" && {
      sortBy: state.sort,
      sortOrder: state.sort === "rating" ? ("desc" as const) : ("asc" as const),
    }),
  });

  const hasFilters =
    state.search !== "" ||
    state.category !== "" ||
    state.businessType !== "" ||
    state.price !== "" ||
    state.minRating !== "" ||
    state.openOnly;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[17rem_1fr]">
      {/* Desktop rail. Sticky, because the grid beside it is long. */}
      <aside className="sticky top-24 hidden rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-5 shadow-card lg:block">
        <RestaurantFilters state={state} onChange={setParams} onClear={clearAll} />
      </aside>

      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => applyQuick(filter.key)}
              aria-pressed={activeQuick === filter.key}
              className={cn(
                "h-9 rounded-full border px-4 text-sm font-bold transition-all",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                activeQuick === filter.key
                  ? "border-transparent bg-brand text-brand-contrast shadow-card"
                  : "border-border-default bg-surface text-secondary hover:border-brand hover:text-brand",
              )}
            >
              {filter.label}
            </button>
          ))}

          {/* Below lg the rail is a drawer — the same component, not a second one. */}
          <Drawer>
            <DrawerTrigger
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border border-border-default bg-surface px-4",
                "text-sm font-bold text-secondary transition-colors hover:border-brand hover:text-brand lg:hidden",
              )}
            >
              <SlidersHorizontal aria-hidden className="size-4" />
              Filters
            </DrawerTrigger>
            <DrawerContent title="Filters" side="left" width="sm">
              <div className="p-5">
                <RestaurantFilters state={state} onChange={setParams} onClear={clearAll} />
              </div>
            </DrawerContent>
          </Drawer>

          {data !== undefined && (
            <span className="numeric ml-auto text-sm text-muted" aria-live="polite">
              {data.meta.total} {businessTypeCountNoun(state.businessType as BusinessType | "", data.meta.total)}{" "}
              found
            </span>
          )}
        </div>

        {isPending ? (
          <RestaurantGridSkeleton count={6} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : data.items.length === 0 ? (
          <EmptyState
            title={hasFilters ? "Nothing matches those filters" : "No places here yet"}
            description={
              hasFilters
                ? "Try widening your search — fewer filters, another cuisine, or a different kind of place."
                : "We're still signing up restaurants, bakeries and cafes in your area. Check back soon."
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={clearAll}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div
              className={cn(
                "grid gap-5 sm:grid-cols-2 xl:grid-cols-3",
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
    </div>
  );
}
