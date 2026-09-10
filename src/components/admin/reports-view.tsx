"use client";

import { AlertTriangle, MapPin, Ticket, TrendingUp } from "lucide-react";
import * as React from "react";

import { BarBreakdown, TrendChart } from "@/components/admin/charts";
import { TabBar } from "@/components/admin/tab-bar";
import { Panel, PortalHeader, StatGrid, StatTile } from "@/components/layout/portal-page";
import { Skeleton, StatTileSkeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import {
  type LeaderboardBoard,
  useCancellationReport,
  useCouponReport,
  useLeaderboard,
  useSalesReport,
  useZoneReport,
} from "@/hooks/use-admin";
import { formatCount, formatPrice } from "@/lib/utils";

type ReportsTab = "sales" | "leaderboards" | "zones" | "coupons" | "cancellations";

const TABS: readonly { value: ReportsTab; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "leaderboards", label: "Leaderboards" },
  { value: "zones", label: "Zones" },
  { value: "coupons", label: "Coupons" },
  { value: "cancellations", label: "Cancellations" },
];

/**
 * Sales, leaderboards, zone performance, coupon usage and cancellations.
 *
 * Every report here defaults to the API's own window (the last 30 days) rather
 * than a picker the operator has to set before seeing anything — the reports
 * answer "how are we doing lately", and lately has a default.
 */
export function AdminReportsView() {
  const [tab, setTab] = React.useState<ReportsTab>("sales");

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Reports"
        description="Sales, leaderboards, zone performance, coupon usage and cancellations. The last 30 days, unless noted."
      />

      <TabBar tabs={TABS} value={tab} onChange={setTab} label="Reports sections" />

      {tab === "sales" && <SalesReportPanel />}
      {tab === "leaderboards" && <LeaderboardsPanel />}
      {tab === "zones" && <ZonesPanel />}
      {tab === "coupons" && <CouponsReportPanel />}
      {tab === "cancellations" && <CancellationsPanel />}
    </div>
  );
}

function SalesReportPanel() {
  const sales = useSalesReport();

  if (sales.isPending) {
    return (
      <div className="flex flex-col gap-6">
        <StatGrid>
          {Array.from({ length: 4 }, (_, index) => (
            <StatTileSkeleton key={index} />
          ))}
        </StatGrid>
        <Skeleton className="h-72 rounded-[var(--radius-panel)]" />
      </div>
    );
  }

  if (sales.isError) {
    return <ErrorState error={sales.error} onRetry={() => void sales.refetch()} />;
  }

  const report = sales.data;

  return (
    <div className="flex flex-col gap-6">
      <StatGrid>
        <StatTile
          label="Orders"
          value={formatCount(report.orders)}
          icon={<TrendingUp className="size-4" />}
        />
        <StatTile
          label="Revenue"
          value={formatPrice(report.revenue)}
          hint="Paid or will be — cancellations excluded"
          icon={<TrendingUp className="size-4" />}
          tone="success"
        />
        <StatTile
          label="Commission"
          value={formatPrice(report.commission)}
          tone="brand"
        />
        <StatTile
          label="Average order"
          value={formatPrice(report.averageOrderValue)}
          hint={report.discounts > 0 ? `${formatPrice(report.discounts)} discounted` : undefined}
        />
      </StatGrid>

      <Panel title="Revenue by day">
        <TrendChart
          points={report.daily.map((point) => ({ date: point.date, value: point.revenue }))}
          label="Revenue per day"
          format={(value) => formatPrice(value)}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="By payment method">
          <BarBreakdown
            rows={report.byPaymentMethod.map((row) => ({
              label: PAYMENT_LABELS[row.label] ?? row.label,
              value: row.amount ?? 0,
              note: `${formatCount(row.count)} orders`,
            }))}
            format={(value) => formatPrice(value)}
          />
        </Panel>
        <Panel title="By status">
          <BarBreakdown
            rows={report.byStatus.map((row) => ({
              label: STATUS_LABELS[row.label] ?? row.label,
              value: row.count,
            }))}
            format={(value) => formatCount(value)}
          />
        </Panel>
      </div>
    </div>
  );
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH_ON_DELIVERY: "Cash on delivery",
  WALLET: "Wallet",
  CARD: "Card",
  JAZZCASH: "JazzCash",
  EASYPAISA: "Easypaisa",
  BANK_TRANSFER: "Bank transfer",
  QR_TRANSFER: "Scan & pay (QR)",
};

const STATUS_LABELS: Record<string, string> = {
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
  FAILED: "Failed",
};

function LeaderboardsPanel() {
  const [board, setBoard] = React.useState<LeaderboardBoard>("restaurants");
  const leaderboard = useLeaderboard(board, { limit: 10 });

  return (
    <Panel
      title="Leaderboards"
      description={
        board === "riders" ? "By completed deliveries." : "By revenue, over the last 30 days."
      }
      action={
        <TabBar
          label="Leaderboard"
          value={board}
          onChange={setBoard}
          tabs={[
            { value: "restaurants", label: "Restaurants" },
            { value: "riders", label: "Riders" },
            { value: "customers", label: "Customers" },
          ]}
          className="w-auto"
        />
      }
    >
      {leaderboard.isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : leaderboard.isError ? (
        <ErrorState
          density="inline"
          error={leaderboard.error}
          onRetry={() => void leaderboard.refetch()}
        />
      ) : leaderboard.data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          Nothing to rank yet in this window.
        </p>
      ) : (
        <ol className="flex flex-col divide-y divide-border-subtle">
          {leaderboard.data.map((row, index) => (
            <li key={row.id} className="flex items-center gap-4 py-3">
              <span className="numeric w-6 shrink-0 text-center text-sm font-bold text-muted">
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold text-primary">{row.name}</span>
                {row.rating !== null && (
                  <span className="text-xs text-muted">★ {row.rating.toFixed(1)}</span>
                )}
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="numeric font-bold text-primary">
                  {board === "riders" ? formatCount(row.orders) : formatPrice(row.revenue)}
                </span>
                <span className="numeric text-xs text-muted">
                  {board === "riders"
                    ? "deliveries"
                    : `${formatCount(row.orders)} orders`}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function ZonesPanel() {
  const zones = useZoneReport();

  return (
    <Panel title="Orders and revenue by zone" description="Where the demand actually is.">
      {zones.isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : zones.isError ? (
        <ErrorState density="inline" error={zones.error} onRetry={() => void zones.refetch()} />
      ) : zones.data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          <MapPin className="mx-auto mb-2 size-6 text-muted" aria-hidden />
          No zone activity in this window.
        </p>
      ) : (
        <BarBreakdown
          rows={zones.data.map((row) => ({
            label: row.zoneName,
            value: row.revenue,
            note: `${formatCount(row.orders)} orders`,
          }))}
          format={(value) => formatPrice(value)}
        />
      )}
    </Panel>
  );
}

function CouponsReportPanel() {
  const coupons = useCouponReport();

  return (
    <Panel title="What the discounts cost" description="Redemptions and money given away, per campaign.">
      {coupons.isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : coupons.isError ? (
        <ErrorState density="inline" error={coupons.error} onRetry={() => void coupons.refetch()} />
      ) : coupons.data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          <Ticket className="mx-auto mb-2 size-6 text-muted" aria-hidden />
          No coupon redemptions in this window.
        </p>
      ) : (
        <BarBreakdown
          rows={coupons.data.map((row) => ({
            label: row.code,
            value: row.discount,
            note: `${formatCount(row.redemptions)} uses`,
          }))}
          format={(value) => formatPrice(value)}
        />
      )}
    </Panel>
  );
}

function CancellationsPanel() {
  const cancellations = useCancellationReport();

  return (
    <Panel
      title="What went wrong, and whose decision it was"
      description="A customer changing their mind and a kitchen rejecting orders are different problems."
    >
      {cancellations.isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : cancellations.isError ? (
        <ErrorState
          density="inline"
          error={cancellations.error}
          onRetry={() => void cancellations.refetch()}
        />
      ) : cancellations.data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          <AlertTriangle className="mx-auto mb-2 size-6 text-muted" aria-hidden />
          Nothing cancelled or rejected in this window.
        </p>
      ) : (
        <BarBreakdown
          rows={cancellations.data.map((row) => ({
            label: `${row.status}${row.cancelledBy === null ? "" : ` — ${cancelledByLabel(row.cancelledBy)}`}`,
            value: row.count,
          }))}
          format={(value) => formatCount(value)}
        />
      )}
    </Panel>
  );
}

function cancelledByLabel(actor: string): string {
  return actor === "CUSTOMER"
    ? "customer"
    : actor === "RESTAURANT"
      ? "kitchen"
      : actor === "DRIVER"
        ? "rider"
        : actor === "ADMIN"
          ? "staff"
          : "system";
}
