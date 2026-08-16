import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Checkout" };

export default function Page() {
  return (
    <div className="container-zass py-10">
      <PhasePlaceholder
        phase="Coming soon"
        title="Checkout"
        description="Confirm the address, choose how to pay and place the order."
        endpoints={[
          "GET /cart",
          "GET /payments/methods",
          "POST /orders",
          "POST /payments/orders/:orderId/checkout",
        ]}
      />
    </div>
  );
}
