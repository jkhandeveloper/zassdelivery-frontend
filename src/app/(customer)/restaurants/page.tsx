import { Suspense } from "react";

import { RestaurantBrowser } from "@/components/restaurant/restaurant-browser";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { RestaurantGridSkeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Restaurants",
  description: "Browse every restaurant delivering near you on ZassDelivery.",
};

export default function RestaurantsPage() {
  return (
    // The customer layout already provides <main id="main">; a second one here
    // would duplicate the landmark the skip link targets.
    <div className="container-zass py-8 lg:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Restaurants" }]} />

      <header className="mb-7 mt-4 flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">Restaurants</h1>
        <p className="text-secondary">Find your next meal from the kitchens delivering near you.</p>
      </header>

      {/* Filters live in the query string, so this reads useSearchParams. */}
      <Suspense fallback={<RestaurantGridSkeleton />}>
        <RestaurantBrowser />
      </Suspense>
    </div>
  );
}
