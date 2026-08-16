import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export default function VendorDashboardPage() {
  return (
    <PhasePlaceholder
      phase="Phase 6"
      title="Vendor dashboard"
      description="The approval-status banner, live order summary and today's takings. The vendor shell, role guard and navigation around it are ready now."
      endpoints={[
        "GET /restaurant-management/mine",
        "POST /restaurant-management/:id/resubmit",
        "GET /order-management/restaurants/:id",
      ]}
    />
  );
}
