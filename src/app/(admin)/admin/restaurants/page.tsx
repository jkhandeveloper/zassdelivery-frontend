import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Restaurants" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Restaurants"
      description="The approval queue and every business on the platform — restaurants, bakeries, cafes and shops."
      endpoints={[
        "GET /restaurant-management",
        "POST /restaurant-management/:id/approve",
        "POST /restaurant-management/:id/reject",
      ]}
    />
  );
}
