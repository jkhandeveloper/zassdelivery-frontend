import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Reports" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Reports"
      description="Sales, leaderboards, zone performance, coupon usage and cancellations."
      endpoints={[
        "GET /admin/reports/sales",
        "GET /admin/reports/restaurants",
        "GET /admin/reports/zones",
      ]}
    />
  );
}
