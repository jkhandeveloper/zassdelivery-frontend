import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Withdrawals" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Withdrawals"
      description="Request a payout and track the ones in flight."
      endpoints={[
        "GET /riders/me/withdrawals",
        "POST /riders/me/withdrawals",
      ]}
    />
  );
}
