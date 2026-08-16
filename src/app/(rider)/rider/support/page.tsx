import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Support" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Support"
      description="Raise a ticket and follow the conversation."
      endpoints={[
        "GET /support-tickets",
        "POST /support-tickets",
      ]}
    />
  );
}
