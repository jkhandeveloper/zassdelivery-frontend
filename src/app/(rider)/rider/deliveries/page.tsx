import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Deliveries" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Deliveries"
      description="Your active run and everything you have delivered."
      endpoints={[
        "GET /riders/me/deliveries",
        "POST /riders/me/deliveries/:orderId/confirm",
      ]}
    />
  );
}
