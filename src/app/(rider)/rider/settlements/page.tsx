"use client";

import { HandCoins, Store, Wallet } from "lucide-react";
import * as React from "react";

import { Panel, PortalHeader, StatGrid, StatTile } from "@/components/layout/portal-page";
import { RiderGate } from "@/components/rider/rider-gate";
import {
  BalanceBadge,
  LedgerEntriesPanel,
  RecordReceiptModal,
  SettlementPaymentsPanel,
} from "@/components/settlements/settlement-parts";
import { Button } from "@/components/ui/button";
import { StatTileSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import {
  useRecordFeesReceived,
  useRiderSettlementEntries,
  useRiderSettlementPayments,
  useRiderSettlements,
} from "@/hooks/use-riders";
import { formatPrice } from "@/lib/utils";
import type { RestaurantBalanceDto } from "@/types/rider";

export default function RiderSettlementsPage() {
  return <RiderGate>{() => <Settlements />}</RiderGate>;
}

/**
 * What the rider and each restaurant owe each other.
 *
 * The rider keeps every order's delivery fee and tip. On a cash order they hand
 * the rest to the restaurant; on an order the restaurant was paid for directly,
 * the restaurant owes them the fee. The platform only keeps score.
 */
function Settlements() {
  const balances = useRiderSettlements();
  const entries = useRiderSettlementEntries({ limit: 20 });
  const payments = useRiderSettlementPayments({ limit: 20 });
  const record = useRecordFeesReceived();
  const [receiving, setReceiving] = React.useState<RestaurantBalanceDto | null>(null);

  const rows = balances.data ?? [];
  const youOwe = rows.reduce((sum, row) => sum + Math.max(0, row.balance), 0);
  const owedToYou = rows.reduce((sum, row) => sum + Math.max(0, -row.balance), 0);

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Cash & fees"
        description="You keep each order's delivery fee and tip. Hand the rest of any cash you collect to the business. When a business was paid directly, it owes you your fee."
      />

      {balances.isPending ? (
        <StatGrid className="xl:grid-cols-2">
          <StatTileSkeleton />
          <StatTileSkeleton />
        </StatGrid>
      ) : balances.isError ? (
        <ErrorState error={balances.error} onRetry={() => void balances.refetch()} />
      ) : (
        <StatGrid className="xl:grid-cols-2">
          <StatTile
            label="You owe businesses"
            value={formatPrice(youOwe)}
            hint="Cash to hand over"
            icon={<Wallet className="size-4" />}
            tone="warm"
          />
          <StatTile
            label="Businesses owe you"
            value={formatPrice(owedToYou)}
            hint="Delivery fees not yet paid"
            icon={<HandCoins className="size-4" />}
            tone="success"
          />
        </StatGrid>
      )}

      <Panel
        title="By business"
        description="When a business pays you, record it here. Cash you hand over is confirmed by the business."
        bodyClassName="p-0"
      >
        {balances.isPending ? null : balances.isError ? null : rows.length === 0 ? (
          <EmptyState
            density="inline"
            icon={<Store className="size-6" />}
            title="Nothing to settle"
            description="Businesses you deliver for appear here after your first delivery."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((row) => (
              <li
                key={row.restaurantId}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-semibold text-primary">{row.restaurantName}</span>
                  <span className="text-xs text-muted">
                    {row.deliveries} {row.deliveries === 1 ? "delivery" : "deliveries"} · collected{" "}
                    {formatPrice(row.cashCollected)} · your fees {formatPrice(row.riderFees)}
                    {row.restaurantPhone !== null && ` · ${row.restaurantPhone}`}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <BalanceBadge balance={row.balance} viewer="rider" />
                  {row.balance < 0 && (
                    <Button size="sm" variant="outline" onClick={() => setReceiving(row)}>
                      Record fees received
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <LedgerEntriesPanel query={entries} viewer="rider" />
      <SettlementPaymentsPanel query={payments} viewer="rider" />

      <RecordReceiptModal
        open={receiving !== null}
        title={`Fees from ${receiving?.restaurantName ?? ""}`}
        description="Record what the business paid you. Only you can confirm money that reached you."
        max={Math.max(0, -(receiving?.balance ?? 0))}
        onSubmit={(amount, note) =>
          record.mutateAsync({ restaurantId: receiving?.restaurantId ?? "", amount, note })
        }
        onClose={() => setReceiving(null)}
      />
    </div>
  );
}
