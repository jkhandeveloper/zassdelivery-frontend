import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Dispatch" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Dispatch"
      description="Live delivery assignments, and manual dispatch when automatic offers go unanswered."
      endpoints={[
        "GET /rider-management/assignments",
        "POST /rider-management/orders/:orderId/assign",
        "GET /realtime/presence",
      ]}
    />
  );
}
