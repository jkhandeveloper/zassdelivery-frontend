import { CartView } from "@/components/cart/cart-view";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = { title: "Your cart" };

export default function Page() {
  return (
    <div className="container-zass py-8 lg:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Your cart" }]} />

      <header className="mb-7 mt-4 flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">Your cart</h1>
        <p className="text-secondary">
          Check the items, apply a coupon, then head to checkout.
        </p>
      </header>

      <CartView />
    </div>
  );
}
