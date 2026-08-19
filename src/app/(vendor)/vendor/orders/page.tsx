"use client";

import { PortalHeader } from "@/components/layout/portal-page";
import { OrderQueue } from "@/components/vendor/order-queue";
import { VendorGate } from "@/components/vendor/vendor-gate";
import { AcceptingOrdersToggle } from "@/components/vendor/accepting-toggle";

export default function VendorOrdersPage() {
  return (
    <VendorGate>
      {(restaurant) => (
        <div className="flex flex-col gap-6">
          <PortalHeader
            title="Order queue"
            description="Live tickets, newest first. New orders arrive on their own."
            action={<AcceptingOrdersToggle restaurant={restaurant} />}
          />
          <OrderQueue restaurantId={restaurant.id} />
        </div>
      )}
    </VendorGate>
  );
}
