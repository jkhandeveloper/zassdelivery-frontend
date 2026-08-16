import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Coupons" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Coupons"
      description="Create and manage discount codes."
      endpoints={[
        "GET /coupons",
        "POST /coupons",
        "PATCH /coupons/:id",
      ]}
    />
  );
}
