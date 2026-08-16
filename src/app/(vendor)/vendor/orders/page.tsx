import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Order queue" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Order queue"
      description="Incoming orders, from accept through to ready for pickup."
      endpoints={[
        "GET /order-management/restaurants/:id",
        "POST /order-management/:id/accept",
        "POST /order-management/:id/ready",
      ]}
    />
  );
}
