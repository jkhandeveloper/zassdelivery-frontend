import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Your cart" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Your cart"
      description="Review items, apply a coupon, pick a delivery address and add a tip before checkout."
      endpoints={[
        "GET /cart",
        "PATCH /cart/items/:id",
        "POST /cart/coupon",
        "PATCH /cart/address",
      ]}
    />
  );
}
