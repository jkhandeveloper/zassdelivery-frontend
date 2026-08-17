import { OrderHistory } from "@/components/orders/order-history";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = { title: "Your orders" };

export default function Page() {
  return (
    <div className="container-zass py-8 lg:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My orders" }]} />

      <header className="mb-7 mt-4 flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">My orders</h1>
        <p className="text-secondary">
          Everything you have ordered, with the live ones first.
        </p>
      </header>

      <OrderHistory />
    </div>
  );
}
