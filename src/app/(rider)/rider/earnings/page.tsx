"use client";

import { Banknote, CalendarRange, TrendingUp, Wallet } from "lucide-react";

import { Panel, PortalHeader, StatGrid, StatTile } from "@/components/layout/portal-page";
import { RiderGate } from "@/components/rider/rider-gate";
import { StatTileSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Badge } from "@/components/ui/status-pill";
import { useEarningsSummary, useRiderEarnings } from "@/hooks/use-riders";
import { formatDateTime, formatPrice } from "@/lib/utils";

/** Earning types, as a rider would name them. */
const EARNING_LABELS: Record<string, string> = {
  BASE_FARE: "Base fare",
  DISTANCE: "Distance",
  TIP: "Tip",
  BONUS: "Bonus",
  ADJUSTMENT: "Adjustment",
};

export default function RiderEarningsPage() {
  return <RiderGate>{() => <Earnings />}</RiderGate>;
}

function Earnings() {
  const summary = useEarningsSummary();
  const ledger = useRiderEarnings({ limit: 50, sortBy: "earnedAt", sortOrder: "desc" });

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Earnings"
        description="What you've made, and the line-by-line behind it."
      />

      {summary.isPending ? (
        <StatGrid>
          {Array.from({ length: 4 }, (_, index) => (
            <StatTileSkeleton key={index} />
          ))}
        </StatGrid>
      ) : summary.isError ? (
        <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
      ) : (
        <StatGrid>
          <StatTile
            label="Today"
            value={formatPrice(summary.data.today)}
            hint={`${summary.data.deliveriesToday} ${summary.data.deliveriesToday === 1 ? "delivery" : "deliveries"}`}
            icon={<Banknote className="size-4" />}
            tone="success"
          />
          <StatTile
            label="This week"
            value={formatPrice(summary.data.thisWeek)}
            hint={`${summary.data.deliveriesThisWeek} deliveries`}
            icon={<CalendarRange className="size-4" />}
            tone="brand"
          />
          <StatTile
            label="This month"
            value={formatPrice(summary.data.thisMonth)}
            icon={<CalendarRange className="size-4" />}
            tone="warm"
          />
          <StatTile
            label="Average per delivery"
            value={formatPrice(summary.data.averagePerDelivery)}
            hint={`over ${summary.data.deliveriesLifetime} deliveries`}
            icon={<TrendingUp className="size-4" />}
          />
        </StatGrid>
      )}

      <Panel
        title="Every line"
        description="Base fares, distance, tips and adjustments as they were credited."
        bodyClassName="p-0"
      >
        {ledger.isPending ? (
          <ul className="divide-y divide-border-subtle">
            {Array.from({ length: 6 }, (_, index) => (
              <li key={index} className="h-[4.5rem] animate-pulse bg-surface-muted/40" />
            ))}
          </ul>
        ) : ledger.isError ? (
          <ErrorState density="inline" error={ledger.error} onRetry={() => void ledger.refetch()} />
        ) : ledger.data.items.length === 0 ? (
          <EmptyState
            density="inline"
            icon={<Wallet className="size-6" />}
            title="Nothing earned yet"
            description="Complete a delivery and the breakdown will appear here."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {ledger.data.items.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-primary">
                      {EARNING_LABELS[entry.type] ?? entry.type}
                    </span>
                    {entry.orderNumber !== null && (
                      <Badge variant="outline" size="sm" className="numeric">
                        {entry.orderNumber}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted">
                    {entry.description ?? formatDateTime(entry.earnedAt)}
                  </span>
                </div>
                <span className="numeric shrink-0 font-bold text-success">
                  +{formatPrice(entry.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
