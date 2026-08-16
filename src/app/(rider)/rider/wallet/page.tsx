import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Wallet" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Wallet"
      description="Your balance and every movement through it."
      endpoints={[
        "GET /riders/me/wallet",
        "GET /riders/me/wallet/transactions",
      ]}
    />
  );
}
