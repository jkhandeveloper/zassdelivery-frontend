"use client";

import { Banknote, Bike, Inbox, Star } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Panel, PortalHeader, StatGrid, StatTile } from "@/components/layout/portal-page";
import { AvailabilityToggle } from "@/components/rider/availability-toggle";
import { DeliveryPanel } from "@/components/rider/delivery-panel";
import { OfferCard } from "@/components/rider/offer-list";
import { RiderGate } from "@/components/rider/rider-gate";
import { useRealtimeEvent } from "@/components/providers/realtime-provider";
import { Button } from "@/components/ui/button";
import { StatTileSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { useEarningsSummary, useRiderDeliveries, useRiderOffers } from "@/hooks/use-riders";
import { formatPrice } from "@/lib/utils";
import { AssignmentStatus } from "@/types/enums";
import type { RiderDto } from "@/types/rider";

export default function RiderTodayPage() {
  return <RiderGate>{(rider) => <Today rider={rider} />}</RiderGate>;
}

function Today({ rider }: { rider: RiderDto }) {
  const summary = useEarningsSummary();
  const offers = useRiderOffers({ liveOnly: true, limit: 5 });
  const deliveries = useRiderDeliveries({ status: AssignmentStatus.ACCEPTED, limit: 5 });

  const { refetch: refetchOffers } = offers;
  const { refetch: refetchDeliveries } = deliveries;

  // The two things that change under a rider without them doing anything: a new
  // run arriving, and the order they are carrying moving on.
  useRealtimeEvent(
    "delivery:offered",
    React.useCallback(() => void refetchOffers(), [refetchOffers]),
  );
  useRealtimeEvent(
    "order:status",
    React.useCallback(() => void refetchDeliveries(), [refetchDeliveries]),
  );

  const liveOffers = (offers.data?.items ?? []).filter((offer) => offer.isLive);
  const active = deliveries.data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title={`Hello, ${rider.fullName.split(" ")[0]}`}
        description={
          rider.zoneName === null
            ? "Your day at a glance."
            : `Working out of ${rider.zoneName}.`
        }
        action={<AvailabilityToggle rider={rider} />}
      />

      {summary.isPending ? (
        <StatGrid>
          {Array.from({ length: 4 }, (_, index) => (
            <StatTileSkeleton key={index} />
          ))}
        </StatGrid>
      ) : summary.isSuccess ? (
        <StatGrid>
          <StatTile
            label="Earned today"
            value={formatPrice(summary.data.today)}
            hint={`${summary.data.deliveriesToday} ${summary.data.deliveriesToday === 1 ? "delivery" : "deliveries"}`}
            icon={<Banknote className="size-4" />}
            tone="success"
          />
          <StatTile
            label="This week"
            value={formatPrice(summary.data.thisWeek)}
            hint={`${summary.data.deliveriesThisWeek} deliveries`}
            icon={<Banknote className="size-4" />}
            tone="brand"
          />
          <StatTile
            label="Lifetime deliveries"
            value={summary.data.deliveriesLifetime}
            hint={`${formatPrice(summary.data.averagePerDelivery)} average`}
            icon={<Bike className="size-4" />}
            tone="warm"
          />
          <StatTile
            label="Rating"
            value={rider.rating.toFixed(1)}
            hint={`from ${rider.ratingCount} ${rider.ratingCount === 1 ? "rating" : "ratings"}`}
            icon={<Star className="size-4" />}
          />
        </StatGrid>
      ) : null}

      {active.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl">Carrying now</h2>
          {active.map((assignment) => (
            <DeliveryPanel key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}

      <Panel
        title="Offers"
        description="Runs dispatch has sent you. They expire on a timer."
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/rider/offers">See all</Link>
          </Button>
        }
        bodyClassName="p-0"
      >
        {liveOffers.length === 0 ? (
          <EmptyState
            density="inline"
            icon={<Inbox className="size-6" />}
            title="Nothing waiting"
            description="New runs land here the moment they're offered."
          />
        ) : (
          <ul className="flex flex-col gap-4 p-5 sm:p-6">
            {liveOffers.map((offer) => (
              <li key={offer.id}>
                <OfferCard offer={offer} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
