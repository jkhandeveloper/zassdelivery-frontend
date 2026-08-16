import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Payments" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Payments"
      description="Payments, refunds, the ledger and gateway callbacks."
      endpoints={[
        "GET /payment-management/payments",
        "POST /payment-management/payments/:id/refund",
        "GET /payment-management/webhooks",
      ]}
    />
  );
}
