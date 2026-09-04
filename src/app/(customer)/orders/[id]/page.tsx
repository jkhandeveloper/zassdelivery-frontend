import Link from "next/link";

import { OrderTracker } from "@/components/orders/order-tracker";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = { title: "Track your order" };

/**
 * `params` is a promise in this version of Next — awaited here rather than
 * threaded into the client component, so the tracker receives a plain id.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="container-zass py-8 lg:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My orders", href: "/orders" },
          { label: "Track" },
        ]}
      />

      <header className="mb-7 mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl">Track your order</h1>
          <p className="text-secondary">
            Updates arrive on their own — there is nothing to refresh.
          </p>
        </div>

        <Link href="/orders" className="text-sm font-bold text-brand hover:underline">
          All orders
        </Link>
      </header>

      <OrderTracker orderId={id} />
    </div>
  );
}
