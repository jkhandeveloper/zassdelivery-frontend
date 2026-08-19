"use client";

import { PortalHeader } from "@/components/layout/portal-page";
import { AvailabilityToggle } from "@/components/rider/availability-toggle";
import { OfferList } from "@/components/rider/offer-list";
import { RiderGate } from "@/components/rider/rider-gate";

export default function RiderOffersPage() {
  return (
    <RiderGate>
      {(rider) => (
        <div className="flex flex-col gap-6">
          <PortalHeader
            title="Delivery offers"
            description="Runs offered to you, and the window you have to answer them."
            action={<AvailabilityToggle rider={rider} />}
          />
          <OfferList rider={rider} />
        </div>
      )}
    </RiderGate>
  );
}
