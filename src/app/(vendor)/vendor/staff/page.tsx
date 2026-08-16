import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Staff" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Staff"
      description="The accounts that can work your order queue."
      endpoints={[
        "GET /restaurant-management/:id/staff",
        "POST /restaurant-management/:id/staff",
      ]}
    />
  );
}
