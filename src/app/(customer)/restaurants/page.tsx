import { Suspense } from "react";

import { RestaurantBrowser } from "@/components/restaurant/restaurant-browser";
import { RestaurantGridSkeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Restaurants",
  description: "Browse every restaurant delivering near you on ZassDelivery.",
};

export default function RestaurantsPage() {
  return (
    <main id="main" className="container-zass py-10">
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">Restaurants</h1>
        <p className="text-secondary">Find your next meal from the kitchens delivering near you.</p>
      </header>

      {/* Filters live in the query string, so this reads useSearchParams. */}
      <Suspense fallback={<RestaurantGridSkeleton />}>
        <RestaurantBrowser />
      </Suspense>
    </main>
  );
}
