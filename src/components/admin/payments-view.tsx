"use client";

import {
  Banknote,
  CreditCard,
  HandCoins,
  RefreshCw,
  Undo2,
  Wallet,
  Webhook,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  CellStack,
  DataTable,
  Pagination,
  RowActions,
  type Column,
} from "@/components/admin/data-table";
import {
  FilterBar,
  humaniseEnum,
  SearchInput,
  SelectFilter,
} from "@/components/admin/filter-bar";
import { ConfirmDialog, ReasonDialog } from "@/components/admin/reason-dialog";
import { TabBar } from "@/components/admin/tab-bar";
import { Panel, PortalHeader, StatGrid, StatTile } from "@/components/layout/portal-page";
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
import { StatusPill } from "@/components/ui/status-pill";
import {
  useAdminPayments,
  useAdminTransactions,
  useFailPayment,
  useLedgerSummary,
  useMarkCashCollected,
  useOutstandingCash,
  useReplayWebhook,
  useWebhookEvents,
} from "@/hooks/use-admin";
import { useValueChanged } from "@/hooks/use-value-changed";
import { formatDateTime, formatPrice, formatRelative, hasText } from "@/lib/utils";
import {
  PaymentMethod,
  PaymentStatus,
  TransactionType,
  WebhookStatus,
} from "@/types/enums";
import type { PaymentDto, WebhookEventDto } from "@/types/payment";

type PaymentsTab = "payments" | "cash" | "ledger" | "webhooks";

const TABS: readonly { value: PaymentsTab; label: string }[] = [
  { value: "payments", label: "Payments" },
  { value: "cash", label: "Cash owing" },
  { value: "ledger", label: "Transactions" },
  { value: "webhooks", label: "Gateway callbacks" },
];

/**
 * Payments, refunds, the ledger and gateway callbacks.
 *
 * One screen with five sections rather than five screens, because they are all
 * the same reconciliation task seen from different sides: a customer says they
 * paid, and the answer is in the payment, the callback that should have settled
 * it, or the ledger entry that did.
 */
export function AdminPaymentsView() {
  const params = useSearchParams();
  const initialTab = params.get("tab");

  const [tab, setTab] = React.useState<PaymentsTab>(
    TABS.some((entry) => entry.value === initialTab) ? (initialTab as PaymentsTab) : "payments",
  );

  const ledger = useLedgerSummary();

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Payments"
        description="Payments, refunds, the ledger and gateway callbacks."
      />

      {ledger.isPending ? (
        <StatGrid>
          {Array.from({ length: 4 }, (_, index) => (
            <StatTileSkeleton key={index} />
          ))}
        </StatGrid>
      ) : ledger.isError ? null : (
        <StatGrid>
          <StatTile
            label="Collected"
            value={formatPrice(ledger.data.collected)}
            hint="Successful customer payments, last 30 days"
            icon={<CreditCard className="size-4" />}
            tone="success"
          />
          <StatTile
            label="Refunded"
            value={formatPrice(ledger.data.refunded)}
            hint="Money returned in the same window"
            icon={<Undo2 className="size-4" />}
            tone={ledger.data.refunded > 0 ? "warm" : "neutral"}
          />
          <StatTile
            label="Commission"
            value={formatPrice(ledger.data.commission)}
            hint="Platform's share, confirmed"
            icon={<Wallet className="size-4" />}
            tone="brand"
          />
          <StatTile
            label="Net"
            value={formatPrice(ledger.data.net)}
            hint={`Rider payouts: ${formatPrice(ledger.data.payouts)}`}
            icon={<Banknote className="size-4" />}
          />
        </StatGrid>
      )}

      <TabBar tabs={TABS} value={tab} onChange={setTab} label="Payments sections" />

      {tab === "payments" && <PaymentsTable />}
      {tab === "cash" && <OutstandingCashTable />}
      {tab === "ledger" && <TransactionsTable />}
      {tab === "webhooks" && <WebhooksTable />}
    </div>
  );
}

// ── Payments ───────────────────────────────────────────────────

function PaymentsTable() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<PaymentStatus | "">("");
  const [method, setMethod] = React.useState<PaymentMethod | "">("");
  const [page, setPage] = React.useState(1);

  if (useValueChanged(`${search}|${status}|${method}`) && page !== 1) {
    setPage(1);
  }

  const payments = useAdminPayments({
    page,
    limit: 20,
    search: search === "" ? undefined : search,
    status: status === "" ? undefined : status,
    method: method === "" ? undefined : method,
  });

  const fail = useFailPayment();

  const [failing, setFailing] = React.useState<PaymentDto | null>(null);

  const filtered = search !== "" || status !== "" || method !== "";

  const columns: readonly Column<PaymentDto>[] = [
    {
      key: "order",
      header: "Order",
      cell: (row) => (
        <CellStack
          primary={row.orderNumber}
          secondary={hasText(row.reference) ? row.reference : row.id}
        />
      ),
    },
    {
      key: "method",
      header: "Method",
      hideBelow: "md",
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-secondary">{humaniseEnum(row.method)}</span>
          {hasText(row.gateway) && <span className="text-xs text-muted">{row.gateway}</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill status={row.status} label={row.statusText} size="sm" />
          {hasText(row.failureReason) && (
            <span className="max-w-[16rem] truncate text-xs text-danger">
              {row.failureReason}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (row) => (
        <div className="flex flex-col items-end gap-0.5">
          <span className="numeric font-semibold text-primary">{formatPrice(row.amount)}</span>
          {row.refundedAmount > 0 && (
            <span className="numeric text-xs text-warning">
              −{formatPrice(row.refundedAmount)} refunded
            </span>
          )}
        </div>
      ),
    },
    {
      key: "when",
      header: "Taken",
      align: "right",
      hideBelow: "lg",
      cell: (row) => (
        <span className="numeric text-xs text-muted">
          {formatDateTime(row.paidAt ?? row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: "1%",
      cell: (row) => (
        <RowActions>
          {row.status === PaymentStatus.PENDING && (
            <Button size="sm" variant="ghost" onClick={() => setFailing(row)}>
              <X className="size-4" />
              <span className="sr-only">Mark {row.orderNumber} as failed</span>
            </Button>
          )}
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <Panel bodyClassName="p-0">
        <div className="border-b border-border-subtle p-5 sm:p-6">
          <FilterBar
            onClear={
              filtered
                ? () => {
                    setSearch("");
                    setStatus("");
                    setMethod("");
                  }
                : undefined
            }
          >
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Order number, reference or gateway id"
            />
            <SelectFilter
              label="Status"
              value={status}
              onChange={setStatus}
              allLabel="Any status"
              options={Object.values(PaymentStatus).map((value) => ({
                value,
                label: humaniseEnum(value),
              }))}
            />
            <SelectFilter
              label="Method"
              value={method}
              onChange={setMethod}
              allLabel="Any method"
              options={Object.values(PaymentMethod).map((value) => ({
                value,
                label: humaniseEnum(value),
              }))}
            />
          </FilterBar>
        </div>

        <DataTable
          caption="Payment attempts across every customer and method"
          columns={columns}
          rows={payments.data?.items}
          rowKey={(row) => row.id}
          isPending={payments.isPending}
          isError={payments.isError}
          error={payments.error}
          onRetry={() => void payments.refetch()}
          empty={{
            icon: <CreditCard className="size-6" />,
            title: filtered ? "No payments match those filters" : "No payments yet",
            description: filtered ? "Try a wider search, or clear the filters." : undefined,
          }}
          footer={<Pagination meta={payments.data?.meta} onPageChange={setPage} />}
        />
      </Panel>

      <ReasonDialog
        open={failing !== null}
        onOpenChange={(open) => !open && setFailing(null)}
        title={`Mark ${failing?.orderNumber ?? ""} as failed?`}
        description="Use this for an attempt the gateway never resolved. The customer can then try again."
        placeholder="e.g. JazzCash never sent a callback and the session has expired."
        confirmLabel="Mark as failed"
        pending={fail.isPending}
        successMessage="Payment marked as failed."
        onConfirm={({ reason }) => fail.mutateAsync({ id: failing?.id ?? "", data: { reason } })}
      />
    </>
  );
}

// ── Outstanding cash ───────────────────────────────────────────

/**
 * Cash orders still owing.
 *
 * These normally clear themselves when the rider confirms delivery, so anything
 * sitting here is a reconciliation question rather than a queue: the screen says
 * so, instead of presenting it as work to grind through.
 */
function OutstandingCashTable() {
  const [page, setPage] = React.useState(1);
  const cash = useOutstandingCash({ page, limit: 20 });
  const collect = useMarkCashCollected();

  const [collecting, setCollecting] = React.useState<PaymentDto | null>(null);

  const total = (cash.data?.items ?? []).reduce((sum, payment) => sum + payment.amount, 0);

  const columns: readonly Column<PaymentDto>[] = [
    {
      key: "order",
      header: "Order",
      cell: (row) => (
        <CellStack primary={row.orderNumber} secondary={formatRelative(row.createdAt)} />
      ),
    },
    {
      key: "amount",
      header: "Owing",
      align: "right",
      cell: (row) => (
        <span className="numeric font-semibold text-primary">{formatPrice(row.amount)}</span>
      ),
    },
    {
      key: "age",
      header: "Placed",
      align: "right",
      hideBelow: "md",
      cell: (row) => (
        <span className="numeric text-xs text-muted">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: "1%",
      cell: (row) => (
        <RowActions>
          <Button size="sm" variant="outline" onClick={() => setCollecting(row)}>
            <HandCoins className="size-4" />
            Mark collected
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <Panel
        title="Cash not yet collected"
        description={
          cash.data === undefined
            ? "Cash-on-delivery orders that have not settled."
            : `${formatPrice(total)} outstanding on this page.`
        }
        bodyClassName="p-0"
      >
        <DataTable
          caption="Cash-on-delivery payments still owing"
          columns={columns}
          rows={cash.data?.items}
          rowKey={(row) => row.id}
          isPending={cash.isPending}
          isError={cash.isError}
          error={cash.error}
          onRetry={() => void cash.refetch()}
          empty={{
            icon: <HandCoins className="size-6" />,
            title: "Nothing outstanding",
            description: "Every cash order has settled. Riders confirming delivery does this automatically.",
          }}
          footer={<Pagination meta={cash.data?.meta} onPageChange={setPage} />}
        />
      </Panel>

      <ConfirmDialog
        open={collecting !== null}
        onOpenChange={(open) => !open && setCollecting(null)}
        title={`Mark ${collecting?.orderNumber ?? ""} as collected?`}
        description="Only do this when the cash has actually reached the platform. It settles the payment and posts the commission."
        confirmLabel="Mark collected"
        pending={collect.isPending}
        successMessage="Marked as collected."
        onConfirm={() => collect.mutateAsync(collecting?.id ?? "")}
      />
    </>
  );
}

// ── The ledger ─────────────────────────────────────────────────

function TransactionsTable() {
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState<TransactionType | "">("");
  const [page, setPage] = React.useState(1);

  if (useValueChanged(`${search}|${type}`) && page !== 1) {
    setPage(1);
  }

  const transactions = useAdminTransactions({
    page,
    limit: 25,
    search: search === "" ? undefined : search,
    type: type === "" ? undefined : type,
  });

  const filtered = search !== "" || type !== "";

  return (
    <Panel
      title="The transaction log"
      description="Every movement of money on the platform. Append-only — a correction is another row, never an edit."
      bodyClassName="p-0"
    >
      <div className="border-b border-border-subtle p-5 sm:p-6">
        <FilterBar
          onClear={
            filtered
              ? () => {
                  setSearch("");
                  setType("");
                }
              : undefined
          }
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Reference or description"
          />
          <SelectFilter
            label="Type"
            value={type}
            onChange={setType}
            allLabel="Any type"
            options={Object.values(TransactionType).map((value) => ({
              value,
              label: humaniseEnum(value),
            }))}
          />
        </FilterBar>
      </div>

      <DataTable
        caption="Every transaction on the platform"
        columns={[
          {
            key: "reference",
            header: "Reference",
            cell: (row) => (
              <CellStack
                primary={row.reference}
                secondary={hasText(row.description) ? row.description : undefined}
              />
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: (row) => <span className="text-secondary">{humaniseEnum(row.type)}</span>,
          },
          {
            key: "status",
            header: "Status",
            hideBelow: "md",
            cell: (row) => <StatusPill status={row.status} size="sm" />,
          },
          {
            key: "amount",
            header: "Amount",
            align: "right",
            cell: (row) => (
              <span className="numeric font-semibold text-primary">{formatPrice(row.amount)}</span>
            ),
          },
          {
            key: "when",
            header: "Posted",
            align: "right",
            hideBelow: "lg",
            cell: (row) => (
              <span className="numeric text-xs text-muted">
                {formatDateTime(row.processedAt ?? row.createdAt)}
              </span>
            ),
          },
        ]}
        rows={transactions.data?.items}
        rowKey={(row) => row.id}
        isPending={transactions.isPending}
        isError={transactions.isError}
        error={transactions.error}
        onRetry={() => void transactions.refetch()}
        empty={{
          icon: <Banknote className="size-6" />,
          title: filtered ? "No transactions match those filters" : "Nothing posted yet",
        }}
        footer={<Pagination meta={transactions.data?.meta} onPageChange={setPage} />}
      />
    </Panel>
  );
}

// ── Gateway callbacks ──────────────────────────────────────────

/**
 * Everything a gateway has ever sent us, with the raw payload.
 *
 * This is what answers "the customer says they paid". Only FAILED callbacks are
 * worth replaying — a genuine statement we could not apply for a reason since
 * fixed — so INVALID ones (a signature that did not verify) do not offer the
 * button.
 */
function WebhooksTable() {
  const [status, setStatus] = React.useState<WebhookStatus | "">("");
  const [page, setPage] = React.useState(1);

  if (useValueChanged(status) && page !== 1) {
    setPage(1);
  }

  const webhooks = useWebhookEvents({
    page,
    limit: 20,
    status: status === "" ? undefined : status,
  });

  const replay = useReplayWebhook();
  const [inspecting, setInspecting] = React.useState<WebhookEventDto | null>(null);

  const columns: readonly Column<WebhookEventDto>[] = [
    {
      key: "event",
      header: "Callback",
      cell: (row) => <CellStack primary={row.eventId} secondary={row.gateway} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill status={row.status} size="sm" />
          {hasText(row.error) && (
            <span className="max-w-[18rem] truncate text-xs text-danger">{row.error}</span>
          )}
        </div>
      ),
    },
    {
      key: "attempts",
      header: "Deliveries",
      align: "right",
      hideBelow: "md",
      cell: (row) => <span className="numeric text-secondary">{row.attempts}</span>,
    },
    {
      key: "received",
      header: "Received",
      align: "right",
      hideBelow: "lg",
      cell: (row) => (
        <span className="numeric text-xs text-muted">{formatDateTime(row.receivedAt)}</span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: "1%",
      cell: (row) => (
        <RowActions>
          <Button size="sm" variant="ghost" onClick={() => setInspecting(row)}>
            Payload
          </Button>
          {row.status === WebhookStatus.FAILED && (
            <Button
              size="sm"
              variant="outline"
              loading={replay.isPending}
              onClick={() =>
                replay
                  .mutateAsync(row.id)
                  .then(() => toast.success("Callback replayed."))
                  .catch(() => toast.error("The replay failed again."))
              }
            >
              <RefreshCw className="size-4" />
              Replay
            </Button>
          )}
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <Panel
        title="Gateway callbacks"
        description="Filter to Invalid for signature problems, or Failed for genuine callbacks that could not be applied."
        bodyClassName="p-0"
      >
        <div className="border-b border-border-subtle p-5 sm:p-6">
          <FilterBar onClear={status === "" ? undefined : () => setStatus("")}>
            <SelectFilter
              label="Status"
              value={status}
              onChange={setStatus}
              allLabel="Any status"
              options={Object.values(WebhookStatus).map((value) => ({
                value,
                label: humaniseEnum(value),
              }))}
            />
          </FilterBar>
        </div>

        <DataTable
          caption="Gateway callbacks received by the platform"
          columns={columns}
          rows={webhooks.data?.items}
          rowKey={(row) => row.id}
          isPending={webhooks.isPending}
          isError={webhooks.isError}
          error={webhooks.error}
          onRetry={() => void webhooks.refetch()}
          empty={{
            icon: <Webhook className="size-6" />,
            title: "No callbacks recorded",
            description: "Gateways store every callback here as it arrives.",
          }}
          footer={<Pagination meta={webhooks.data?.meta} onPageChange={setPage} />}
        />
      </Panel>

      <Modal open={inspecting !== null} onOpenChange={(open) => !open && setInspecting(null)}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>{inspecting?.eventId ?? "Payload"}</ModalTitle>
            <ModalDescription>
              {inspecting === null
                ? null
                : `As ${inspecting.gateway} sent it, ${formatRelative(inspecting.receivedAt)}.`}
            </ModalDescription>
          </ModalHeader>
          <ModalBody className="pb-6">
            <pre className="max-h-[60vh] overflow-auto rounded-[var(--radius-card)] bg-surface-sunken p-4 text-xs leading-relaxed">
              {inspecting?.payload === undefined
                ? "The payload was not returned with this record."
                : JSON.stringify(inspecting.payload, null, 2)}
            </pre>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
