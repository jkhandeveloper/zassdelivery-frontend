import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Support" };

export default function Page() {
  return (
    <div className="container-zass py-10">
      <PhasePlaceholder
        phase="Coming soon"
        title="Support"
        description="Raise a ticket about an order and follow the conversation."
        endpoints={[
          "GET /support-tickets",
          "POST /support-tickets",
        ]}
      />
    </div>
  );
}
