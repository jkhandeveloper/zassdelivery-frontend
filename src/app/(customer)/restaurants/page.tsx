import { Suspense } from "react";

import { RestaurantBrowser } from "@/components/restaurant/restaurant-browser";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { RestaurantGridSkeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Places to order from",
  description:
    "Browse every restaurant, bakery, cafe and shop delivering near you on ZassDelivery.",
};

export default function RestaurantsPage() {
  return (
    // The customer layout already provides <main id="main">; a second one here
    // would duplicate the landmark the skip link targets.
    <div className="container-zass py-8 lg:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Order from" }]} />

      <header className="mb-7 mt-4 flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">Order from</h1>
        <p className="text-secondary">
          Restaurants, bakeries, cafes and shops delivering near you.
        </p>
      </header>

      {/* Filters live in the query string, so this reads useSearchParams. */}
      <Suspense fallback={<RestaurantGridSkeleton />}>
        <RestaurantBrowser />
      </Suspense>
    </div>
  );
}
