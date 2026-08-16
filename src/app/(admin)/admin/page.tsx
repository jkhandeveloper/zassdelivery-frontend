import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export default function AdminDashboardPage() {
  return (
    <PhasePlaceholder
      phase="Phase 8"
      title="Admin dashboard"
      description="Queue stats, the actions-required headline and the revenue trend — all from one call. The admin shell, permission-aware navigation and role guard around it are ready now."
      endpoints={["GET /admin/dashboard", "GET /admin/reports/sales"]}
    />
  );
}
