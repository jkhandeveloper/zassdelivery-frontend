import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Support queue" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Support queue"
      description="Incoming tickets, assignment and priority."
      endpoints={[
        "GET /support-tickets",
        "PATCH /support-tickets/:id/assign",
        "GET /support-tickets/queue-summary",
      ]}
    />
  );
}
