"use client";

import { Bike, HandCoins, QrCode, Wallet } from "lucide-react";
import * as React from "react";

import { Panel, PortalHeader, StatGrid, StatTile } from "@/components/layout/portal-page";
import { PaymentQrList } from "@/components/payments/payment-qr-list";
import {
  BalanceBadge,
  LedgerEntriesPanel,
  RecordReceiptModal,
  SettlementPaymentsPanel,
} from "@/components/settlements/settlement-parts";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { StatTileSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { VendorGate } from "@/components/vendor/vendor-gate";
import {
  useRecordCashReceived,
  useRestaurantRiderEntries,
  useRestaurantRiderPayments,
  useRestaurantRiderSettlements,
} from "@/hooks/use-riders";
import { formatPrice } from "@/lib/utils";
import type { RiderBalanceDto } from "@/types/rider";

export function VendorRiderCashView() {
  return (
    <VendorGate>
      {(restaurant) => (
        <div className="flex flex-col gap-6">
          <PortalHeader
            title="Rider cash"
            description="Riders keep each order's delivery fee and tip. On cash orders they hand you the rest; on orders you were paid for directly, you pay them their fee. Record cash here when a rider hands it over."
          />
          <RiderCash restaurantId={restaurant.id} />
        </div>
      )}
    </VendorGate>
  );
}

function RiderCash({ restaurantId }: { restaurantId: string }) {
  const balances = useRestaurantRiderSettlements(restaurantId);
  const entries = useRestaurantRiderEntries(restaurantId, { limit: 20 });
  const payments = useRestaurantRiderPayments(restaurantId, { limit: 20 });
  const record = useRecordCashReceived(restaurantId);
  const [receiving, setReceiving] = React.useState<RiderBalanceDto | null>(null);
  const [paying, setPaying] = React.useState<RiderBalanceDto | null>(null);

  const rows = balances.data ?? [];
  const ridersOwe = rows.reduce((sum, row) => sum + Math.max(0, row.balance), 0);
  const youOwe = rows.reduce((sum, row) => sum + Math.max(0, -row.balance), 0);

  return (
    <>
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
            label="Riders owe you"
            value={formatPrice(ridersOwe)}
            hint="Cash collected, not yet handed over"
            icon={<Wallet className="size-4" />}
            tone="success"
          />
          <StatTile
            label="You owe riders"
            value={formatPrice(youOwe)}
            hint="Delivery fees on orders paid to you"
            icon={<HandCoins className="size-4" />}
            tone="warm"
          />
        </StatGrid>
      )}

      <Panel
        title="By rider"
        description="Fees you pay a rider are confirmed by the rider from their app."
        bodyClassName="p-0"
      >
        {balances.isPending || balances.isError ? null : rows.length === 0 ? (
          <EmptyState
            density="inline"
            icon={<Bike className="size-6" />}
            title="No riders yet"
            description="Riders appear here after their first delivery for you."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((row) => (
              <li
                key={row.driverId}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-semibold text-primary">{row.riderName}</span>
                  <span className="text-xs text-muted">
                    {row.riderPhone} · {row.deliveries}{" "}
                    {row.deliveries === 1 ? "delivery" : "deliveries"} · handed over{" "}
                    {formatPrice(row.cashHandedOver)} · fees paid {formatPrice(row.feesPaid)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <BalanceBadge balance={row.balance} viewer="restaurant" />
                  {row.balance > 0 && (
                    <Button size="sm" variant="outline" onClick={() => setReceiving(row)}>
                      Record cash received
                    </Button>
                  )}
                  {row.balance < 0 && row.paymentQrCodes.length > 0 && (
                    <Button size="sm" variant="outline" onClick={() => setPaying(row)}>
                      <QrCode aria-hidden className="size-4" />
                      Pay rider
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <LedgerEntriesPanel query={entries} viewer="restaurant" />
      <SettlementPaymentsPanel query={payments} viewer="restaurant" />

      <RecordReceiptModal
        open={receiving !== null}
        title={`Cash from ${receiving?.riderName ?? ""}`}
        description="Record the order money this rider handed you. Only you can confirm cash that reached you."
        max={Math.max(0, receiving?.balance ?? 0)}
        onSubmit={(amount, note) =>
          record.mutateAsync({ driverId: receiving?.driverId ?? "", amount, note })
        }
        onClose={() => setReceiving(null)}
      />

      <Modal open={paying !== null} onOpenChange={(open) => !open && setPaying(null)}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>Pay {paying?.riderName ?? ""}</ModalTitle>
            <ModalDescription>
              {paying === null
                ? null
                : `You owe ${formatPrice(-paying.balance)} in delivery fees. Send it to one of these, and the rider confirms it from their app.`}
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            {paying !== null && <PaymentQrList codes={paying.paymentQrCodes} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
