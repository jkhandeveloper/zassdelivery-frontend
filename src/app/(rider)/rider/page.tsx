import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export default function RiderDashboardPage() {
  return (
    <PhasePlaceholder
      phase="Phase 7"
      title="Today"
      description="Availability toggle, the live offers inbox and the active delivery. The rider shell, role guard and navigation around it are ready now."
      endpoints={[
        "PATCH /riders/me/availability",
        "GET /riders/me/offers?liveOnly=true",
        "GET /riders/me/deliveries/:orderId",
      ]}
    />
  );
}
