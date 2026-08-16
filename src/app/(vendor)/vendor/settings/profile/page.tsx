import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Restaurant profile" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Restaurant profile"
      description="Name, description, contact details and location."
      endpoints={[
        "GET /restaurant-management/:id",
        "PATCH /restaurant-management/:id",
      ]}
    />
  );
}
