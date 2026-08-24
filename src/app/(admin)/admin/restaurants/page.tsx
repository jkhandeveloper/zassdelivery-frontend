import { Suspense } from "react";

import { AdminRestaurantsView } from "@/components/admin/restaurants-view";

export const metadata = { title: "Restaurants" };

export default function Page() {
  // The view reads `?status=` to land on the approval queue when the dashboard
  // sent the operator here, which makes it a Suspense boundary's problem.
  return (
    <Suspense>
      <AdminRestaurantsView />
    </Suspense>
  );
}
