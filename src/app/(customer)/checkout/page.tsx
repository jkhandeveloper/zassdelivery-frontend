import { CheckoutView } from "@/components/checkout/checkout-view";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = { title: "Checkout" };

export default function Page() {
  return (
    <div className="container-zass py-8 lg:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Your cart", href: "/cart" },
          { label: "Checkout" },
        ]}
      />

      <header className="mb-7 mt-4 flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">Checkout</h1>
        <p className="text-secondary">
          Confirm where it goes, choose how to pay, and place your order.
        </p>
      </header>

      <CheckoutView />
    </div>
  );
}
