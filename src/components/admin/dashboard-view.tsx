"use client";

import {
  AlertTriangle,
  Bike,
  ChevronRight,
  CreditCard,
  LifeBuoy,
  Radio,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { BarBreakdown, TrendChart } from "@/components/admin/charts";
import { Panel, PortalHeader, StatGrid, StatTile } from "@/components/layout/portal-page";
import { Card } from "@/components/ui/card";
import { Skeleton, StatTileSkeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { Badge } from "@/components/ui/status-pill";
import {
  useAdminDashboard,
  useRealtimePresence,
  useSalesReport,
} from "@/hooks/use-admin";
import { cn, formatCount, formatPrice, formatRelative } from "@/lib/utils";
import type { DashboardQueuesDto } from "@/types/admin";

/**
 * The operations dashboard.
 *
 * Ordered by what an operator does with it rather than by what is easiest to
 * fetch: the work waiting on a person comes first, the state of the platform
 * second, and the trend — the part nobody has to act on today — last.
 *
 * Every queue number is a link. A count that cannot be clicked makes the reader
 * find the screen behind it themselves, which is how a dashboard becomes a thing
 * people glance at and then ignore.
 */
export function AdminDashboardView() {
  const dashboard = useAdminDashboard();
  const presence = useRealtimePresence();
  const sales = useSalesReport();

  if (dashboard.isPending) {
    return <DashboardSkeleton />;
  }

  if (dashboard.isError) {
    return <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />;
  }

  const { totals, queues, operations, trend, actionsRequired, generatedAt } = dashboard.data;

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Today at ZassDelivery"
        description={`Pabbi, Nowshera and Peshawar. Updated ${formatRelative(generatedAt)}.`}
        action={
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant={actionsRequired > 0 ? "gold" : "soft"}>
              {actionsRequired > 0
                ? `${formatCount(actionsRequired)} waiting on you`
                : "Nothing waiting"}
            </Badge>
            {presence.data !== undefined && (
              <span className="numeric text-xs text-muted">
                {formatCount(presence.data.connections)} connected ·{" "}
                {presence.data.gatewayReady ? "gateway up" : "gateway down"}
              </span>
            )}
          </div>
        }
      />

      <ActionQueues queues={queues} total={actionsRequired} />

      <StatGrid>
        <StatTile
          label="Orders today"
          value={formatCount(totals.ordersToday)}
          hint={`${formatCount(totals.ordersInFlight)} still in flight`}
          icon={<Radio className="size-4" />}
          tone={totals.ordersInFlight > 0 ? "brand" : "neutral"}
        />
        <StatTile
          label="Revenue today"
          value={formatPrice(totals.revenueToday)}
          hint={`${formatPrice(totals.revenueThisMonth)} this month`}
          icon={<CreditCard className="size-4" />}
          tone="success"
        />
        <StatTile
          label="Average order"
          value={formatPrice(totals.averageOrderValue)}
          hint="Across the whole platform"
          icon={<Wallet className="size-4" />}
        />
        <StatTile
          label="On the platform"
          value={formatCount(totals.customers)}
          hint={`${formatCount(totals.restaurants)} businesses · ${formatCount(totals.riders)} riders`}
          icon={<Users className="size-4" />}
        />
      </StatGrid>

      {/* Two charts, not one with two axes: orders and revenue are measured in
          different units, and a shared y-scale would make their shapes an
          artefact of the scaling rather than of the business. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Orders" description="The last fortnight, by day.">
          <TrendChart
            points={trend.map((point) => ({ date: point.date, value: point.orders }))}
            label="Orders per day"
          />
        </Panel>
        <Panel title="Revenue" description="The last fortnight, by day.">
          <TrendChart
            points={trend.map((point) => ({ date: point.date, value: point.revenue }))}
            label="Revenue per day"
            format={(value) => formatPrice(value)}
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Right now" description="Who is actually working this minute.">
          <dl className="grid grid-cols-2 gap-5">
            <LiveStat
              label="Riders online"
              value={operations.ridersOnline}
              hint={`${formatCount(operations.ridersOnDelivery)} carrying an order`}
              tone={operations.ridersOnline === 0 ? "danger" : "success"}
            />
            <LiveStat
              label="Kitchens open"
              value={operations.restaurantsAcceptingOrders}
              hint={`${formatCount(operations.restaurantsClosed)} closed or paused`}
              tone={operations.restaurantsAcceptingOrders === 0 ? "danger" : "success"}
            />
            <LiveStat
              label="Orders in flight"
              value={totals.ordersInFlight}
              hint="Placed but not yet delivered"
              tone="neutral"
            />
            <LiveStat
              label="Dispatch watchers"
              value={presence.data?.dispatchWatchers ?? 0}
              hint="Staff on the dispatch board"
              tone="neutral"
            />
          </dl>
        </Panel>

        <Panel
          title="How people pay"
          description={
            sales.data === undefined
              ? "Over the last 30 days."
              : `${formatCount(sales.data.orders)} orders over the last 30 days.`
          }
        >
          {sales.isPending ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : sales.isError ? (
            <ErrorState
              density="inline"
              error={sales.error}
              onRetry={() => void sales.refetch()}
            />
          ) : (
            <BarBreakdown
              rows={sales.data.byPaymentMethod.map((row) => ({
                label: PAYMENT_LABELS[row.label] ?? row.label,
                value: row.amount ?? 0,
                note: `${formatCount(row.count)} orders`,
              }))}
              format={(value) => formatPrice(value)}
              emptyLabel="No payments in this window."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

/** The API sends the enum member; these are what an operator calls them. */
const PAYMENT_LABELS: Record<string, string> = {
  CASH_ON_DELIVERY: "Cash on delivery",
  WALLET: "Wallet",
  CARD: "Card",
  JAZZCASH: "JazzCash",
  EASYPAISA: "Easypaisa",
  BANK_TRANSFER: "Bank transfer",
};

interface QueueEntry {
  label: string;
  count: number;
  href: string;
  icon: React.ReactNode;
  /** What the operator actually does about it. */
  hint: string;
}

function ActionQueues({ queues, total }: { queues: DashboardQueuesDto; total: number }) {
  const entries: QueueEntry[] = [
    {
      label: "Businesses awaiting approval",
      count: queues.restaurantsAwaitingApproval,
      href: "/admin/restaurants?status=PENDING_APPROVAL",
      icon: <Store className="size-4" />,
      hint: "Review the application, then approve or reject.",
    },
    {
      label: "Riders awaiting approval",
      count: queues.ridersAwaitingApproval,
      href: "/admin/riders?status=PENDING_APPROVAL",
      icon: <Bike className="size-4" />,
      hint: "Verify documents before approving.",
    },
    {
      label: "Orders waiting on a kitchen",
      count: queues.ordersAwaitingRestaurant,
      href: "/admin/dispatch",
      icon: <Radio className="size-4" />,
      hint: "Placed, not yet accepted.",
    },
    {
      label: "Orders waiting on a rider",
      count: queues.ordersAwaitingRider,
      href: "/admin/dispatch",
      icon: <Bike className="size-4" />,
      hint: "Cooked with nobody to carry them.",
    },
    {
      label: "Open support tickets",
      count: queues.openTickets,
      href: "/admin/support",
      icon: <LifeBuoy className="size-4" />,
      hint: "Assign, then answer.",
    },
    {
      label: "Withdrawals to pay",
      count: queues.pendingWithdrawals,
      href: "/admin/payments?tab=payouts",
      icon: <Wallet className="size-4" />,
      hint: "Approve, then mark paid with a reference.",
    },
    {
      label: "Unapplied gateway callbacks",
      count: queues.unresolvedWebhooks,
      href: "/admin/payments?tab=webhooks",
      icon: <AlertTriangle className="size-4" />,
      hint: "Replay the ones that failed for a fixed reason.",
    },
  ];

  const pending = entries.filter((entry) => entry.count > 0);

  if (total === 0) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-4 border-success/30 bg-success-soft/40 p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <p className="font-display text-lg font-extrabold text-primary">Every queue is empty</p>
          <p className="text-sm text-secondary">
            No approvals, tickets, payouts or stuck orders are waiting on a person.
          </p>
        </div>
        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-hover"
        >
          Look at the reports instead
          <ChevronRight className="size-4" />
        </Link>
      </Card>
    );
  }

  return (
    <Panel
      title="Waiting on you"
      description="Everything on this list needs a decision from a person."
      bodyClassName="p-0"
    >
      <ul className="divide-y divide-border-subtle">
        {pending.map((entry) => (
          <li key={entry.label}>
            <Link
              href={entry.href}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-muted sm:px-6"
            >
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-gold-soft text-accent-gold"
              >
                {entry.icon}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-bold text-primary">{entry.label}</span>
                <span className="truncate text-xs text-muted">{entry.hint}</span>
              </span>
              <span className="numeric font-display text-2xl font-extrabold text-primary">
                {formatCount(entry.count)}
              </span>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function LiveStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "neutral" | "success" | "danger";
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm font-semibold text-secondary">{label}</dt>
      <dd
        className={cn(
          "numeric font-display text-3xl font-extrabold",
          tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-primary",
        )}
      >
        {formatCount(value)}
      </dd>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-busy aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Loading the dashboard</span>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-64 rounded-[var(--radius-panel)]" />
      <StatGrid>
        {Array.from({ length: 4 }, (_, index) => (
          <StatTileSkeleton key={index} />
        ))}
      </StatGrid>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-[var(--radius-panel)]" />
        <Skeleton className="h-72 rounded-[var(--radius-panel)]" />
      </div>
    </div>
  );
}
