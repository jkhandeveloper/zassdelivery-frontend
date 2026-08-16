import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Offers" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Offers"
      description="Coupons and deals you can use right now."
      endpoints={[
        "GET /coupons/available",
      ]}
    />
  );
}
