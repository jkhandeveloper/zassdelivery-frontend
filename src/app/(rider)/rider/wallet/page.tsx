"use client";

import { ArrowDownLeft, ArrowUpRight, Lock, Wallet } from "lucide-react";
import Link from "next/link";

import { Panel, PortalHeader, StatGrid, StatTile } from "@/components/layout/portal-page";
import { RiderGate } from "@/components/rider/rider-gate";
import { Button } from "@/components/ui/button";
import { StatTileSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useRiderWallet, useWalletTransactions } from "@/hooks/use-riders";
import { cn, formatDateTime, formatPrice } from "@/lib/utils";
import { WalletTransactionType } from "@/types/enums";

/** Wallet reasons, as a rider would name them. */
const REASON_LABELS: Record<string, string> = {
  DRIVER_EARNING: "Delivery earning",
  WITHDRAWAL: "Withdrawal",
  ADJUSTMENT: "Adjustment",
  ORDER_REFUND: "Refund",
  CASHBACK: "Cashback",
  REFERRAL_BONUS: "Referral bonus",
  TOPUP: "Top-up",
  ORDER_PAYMENT: "Order payment",
};

export default function RiderWalletPage() {
  return <RiderGate>{() => <WalletScreen />}</RiderGate>;
}

function WalletScreen() {
  const wallet = useRiderWallet();
  const statement = useWalletTransactions({ limit: 50, sortOrder: "desc" });

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Wallet"
        description="Your balance, and every movement in and out of it."
        action={
          <Button asChild variant="outline">
            <Link href="/rider/withdrawals">Withdraw</Link>
          </Button>
        }
      />

      {wallet.isPending ? (
        <StatGrid className="xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <StatTileSkeleton key={index} />
          ))}
        </StatGrid>
      ) : wallet.isError ? (
        <ErrorState error={wallet.error} onRetry={() => void wallet.refetch()} />
      ) : (
        <>
          {wallet.data.isLocked && (
            <p className="flex items-start gap-2 rounded-[var(--radius-input)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
              <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                Your wallet is frozen while we look into something. Withdrawals are paused —
                support can tell you more.
              </span>
            </p>
          )}

          <StatGrid className="xl:grid-cols-3">
            <StatTile
              label="Balance"
              value={formatPrice(wallet.data.balance)}
              hint={wallet.data.currency}
              icon={<Wallet className="size-4" />}
              tone="brand"
            />
            <StatTile
              label="Available to withdraw"
              value={formatPrice(wallet.data.availableToWithdraw)}
              hint="Balance minus what's already committed"
              icon={<ArrowUpRight className="size-4" />}
              tone="success"
            />
            <StatTile
              label="Held for withdrawals"
              value={formatPrice(wallet.data.pendingWithdrawals)}
              hint="Requests still being processed"
              icon={<ArrowDownLeft className="size-4" />}
              tone="warm"
            />
          </StatGrid>
        </>
      )}

      <Panel title="Statement" description="Newest first." bodyClassName="p-0">
        {statement.isPending ? (
          <ul className="divide-y divide-border-subtle">
            {Array.from({ length: 6 }, (_, index) => (
              <li key={index} className="h-[4.5rem] animate-pulse bg-surface-muted/40" />
            ))}
          </ul>
        ) : statement.isError ? (
          <ErrorState
            density="inline"
            error={statement.error}
            onRetry={() => void statement.refetch()}
          />
        ) : statement.data.items.length === 0 ? (
          <EmptyState
            density="inline"
            icon={<Wallet className="size-6" />}
            title="Nothing has moved yet"
            description="Earnings and withdrawals will show up here as they happen."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {statement.data.items.map((entry) => {
              const credit = entry.type === WalletTransactionType.CREDIT;

              return (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl",
                        credit ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                      )}
                    >
                      {credit ? (
                        <ArrowDownLeft className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-semibold text-primary">
                        {REASON_LABELS[entry.reason] ?? entry.reason}
                      </span>
                      <span className="text-xs text-muted">
                        {entry.description ?? formatDateTime(entry.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span
                      className={cn(
                        "numeric font-bold",
                        credit ? "text-success" : "text-danger",
                      )}
                    >
                      {credit ? "+" : "−"}
                      {formatPrice(Math.abs(entry.amount))}
                    </span>
                    <span className="numeric text-xs text-muted">
                      {formatPrice(entry.balanceAfter)} after
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
