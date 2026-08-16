import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Opening hours" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Opening hours"
      description="When you are open, and pausing orders when you are not."
      endpoints={[
        "GET /restaurants/:id/hours",
        "PUT /restaurant-management/:id/hours",
        "PATCH /restaurant-management/:id/accepting-orders",
      ]}
    />
  );
}
