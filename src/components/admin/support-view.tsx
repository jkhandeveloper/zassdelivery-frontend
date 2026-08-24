"use client";

import { LifeBuoy, Send, User } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  CellStack,
  DataTable,
  Pagination,
  RowActions,
  type Column,
} from "@/components/admin/data-table";
import { FilterBar, humaniseEnum, SearchInput, SelectFilter } from "@/components/admin/filter-bar";
import { TabBar } from "@/components/admin/tab-bar";
import { Panel, PortalHeader, StatGrid, StatTile } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ListSkeleton } from "@/components/ui/skeleton";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import {
  useAdminTickets,
  useChangeTicketPriority,
  useChangeTicketStatus,
  useTicketQueueSummary,
} from "@/hooks/use-admin";
import { useReplyToTicket, useTicket } from "@/hooks/use-support";
import { useValueChanged } from "@/hooks/use-value-changed";
import { ApiError } from "@/lib/api-client";
import { cn, formatRelative, hasText } from "@/lib/utils";
import { TicketCategory, TicketPriority, TicketStatus } from "@/types/enums";
import type { TicketDto } from "@/types/support";

type QueueTab = "open" | "all";

/**
 * Incoming tickets, assignment and priority.
 *
 * `GET /support-tickets` already scopes to the whole queue for staff, so this
 * is the same list a customer sees of their own tickets, seen through an
 * admin's token — no separate "admin ticket" concept exists on the backend and
 * none is invented here.
 */
export function AdminSupportView() {
  const [tab, setTab] = React.useState<QueueTab>("open");
  const [search, setSearch] = React.useState("");
  const [priority, setPriority] = React.useState<TicketPriority | "">("");
  const [category, setCategory] = React.useState<TicketCategory | "">("");
  const [page, setPage] = React.useState(1);

  if (useValueChanged(`${tab}|${search}|${priority}|${category}`) && page !== 1) {
    setPage(1);
  }

  const summary = useTicketQueueSummary();

  const tickets = useAdminTickets({
    page,
    limit: 20,
    openOnly: tab === "open" ? true : undefined,
    search: search === "" ? undefined : search,
    priority: priority === "" ? undefined : priority,
    category: category === "" ? undefined : category,
    sortBy: "priority",
    sortOrder: "desc",
  });

  const [viewing, setViewing] = React.useState<TicketDto | null>(null);

  const filtered = search !== "" || priority !== "" || category !== "";

  const columns: readonly Column<TicketDto>[] = [
    {
      key: "ticket",
      header: "Ticket",
      cell: (row) => <CellStack primary={row.subject} secondary={row.ticketNumber} />,
    },
    {
      key: "customer",
      header: "Customer",
      hideBelow: "md",
      cell: (row) => (
        <CellStack primary={row.customerName} secondary={row.customerPhone} />
      ),
    },
    {
      key: "category",
      header: "Category",
      hideBelow: "lg",
      cell: (row) => <span className="text-secondary">{humaniseEnum(row.category)}</span>,
    },
    {
      key: "priority",
      header: "Priority",
      cell: (row) => <StatusPill status={row.priority} size="sm" />,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill status={row.status} size="sm" />
          <span className="text-xs text-muted">
            {hasText(row.assignedToName) ? row.assignedToName : "Unassigned"}
          </span>
        </div>
      ),
    },
    {
      key: "updated",
      header: "Last activity",
      align: "right",
      hideBelow: "lg",
      cell: (row) => (
        <span className="numeric text-xs text-muted">{formatRelative(row.updatedAt)}</span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: "1%",
      cell: (row) => (
        <RowActions>
          <Button size="sm" variant="outline" onClick={() => setViewing(row)}>
            Open
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader title="Support queue" description="Incoming tickets, assignment and priority." />

      {summary.data !== undefined && (
        <StatGrid>
          <StatTile label="Open" value={summary.data.open} />
          {summary.data.byStatus
            .filter((row) => row.status !== TicketStatus.CLOSED)
            .slice(0, 3)
            .map((row) => (
              <StatTile
                key={row.status}
                label={humaniseEnum(row.status)}
                value={row.count}
                tone={row.status === TicketStatus.OPEN ? "warm" : "neutral"}
              />
            ))}
        </StatGrid>
      )}

      <TabBar
        label="Ticket queue"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "open", label: "Open", count: summary.data?.open },
          { value: "all", label: "All tickets" },
        ]}
      />

      <Panel bodyClassName="p-0">
        <div className="border-b border-border-subtle p-5 sm:p-6">
          <FilterBar
            onClear={
              filtered
                ? () => {
                    setSearch("");
                    setPriority("");
                    setCategory("");
                  }
                : undefined
            }
          >
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Ticket number or subject"
            />
            <SelectFilter
              label="Priority"
              value={priority}
              onChange={setPriority}
              allLabel="Any priority"
              options={Object.values(TicketPriority).map((value) => ({
                value,
                label: humaniseEnum(value),
              }))}
            />
            <SelectFilter
              label="Category"
              value={category}
              onChange={setCategory}
              allLabel="Any category"
              options={Object.values(TicketCategory).map((value) => ({
                value,
                label: humaniseEnum(value),
              }))}
            />
          </FilterBar>
        </div>

        <DataTable
          caption="Support tickets"
          columns={columns}
          rows={tickets.data?.items}
          rowKey={(row) => row.id}
          isPending={tickets.isPending}
          isError={tickets.isError}
          error={tickets.error}
          onRetry={() => void tickets.refetch()}
          empty={{
            icon: <LifeBuoy className="size-6" />,
            title:
              tab === "open"
                ? "Nothing open"
                : filtered
                  ? "No tickets match those filters"
                  : "No tickets yet",
            description: tab === "open" ? "Every ticket has been answered or closed." : undefined,
          }}
          footer={<Pagination meta={tickets.data?.meta} onPageChange={setPage} />}
        />
      </Panel>

      <TicketModal ticketId={viewing?.id ?? null} onClose={() => setViewing(null)} />
    </div>
  );
}

/**
 * One ticket's thread.
 *
 * Refetched by id rather than reusing the row from the list, because the list
 * strips internal notes for nobody — staff see them — but the row itself is
 * still a summary (`messageCount`, not `messages`) on some call sites, and a
 * fresh fetch is what the reply mutation already invalidates.
 */
function TicketModal({ ticketId, onClose }: { ticketId: string | null; onClose: () => void }) {
  const ticket = useTicket(ticketId);
  const status = useChangeTicketStatus();
  const priority = useChangeTicketPriority();
  const reply = useReplyToTicket(ticketId ?? "");

  const [message, setMessage] = React.useState("");
  const [internal, setInternal] = React.useState(false);

  if (useValueChanged(ticketId)) {
    setMessage("");
    setInternal(false);
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();

    if (!hasText(message)) {
      return;
    }

    try {
      await reply.mutateAsync({ message: message.trim(), isInternal: internal });
      setMessage("");
      toast.success(internal ? "Internal note added." : "Reply sent.");
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "That did not go through.");
    }
  }

  const current = ticket.data;

  return (
    <Modal open={ticketId !== null} onOpenChange={(open) => !open && onClose()}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>{current?.subject ?? "Ticket"}</ModalTitle>
          <ModalDescription>
            {current === undefined
              ? null
              : `${current.ticketNumber} · ${current.customerName} · ${current.customerPhone}`}
          </ModalDescription>
        </ModalHeader>

        {ticket.isPending ? (
          <ModalBody className="pb-6">
            <ListSkeleton count={2} label="Loading the ticket thread" />
          </ModalBody>
        ) : ticket.isError ? (
          <ModalBody className="pb-6">
            <ErrorState density="inline" error={ticket.error} onRetry={() => void ticket.refetch()} />
          </ModalBody>
        ) : current !== undefined && (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-6 pb-4">
              <select
                aria-label="Status"
                value={current.status}
                onChange={(event) =>
                  status
                    .mutateAsync({
                      id: current.id,
                      data: { status: event.target.value as TicketStatus },
                    })
                    .then(() => toast.success("Status updated."))
                    .catch(() => toast.error("Could not update the status."))
                }
                className="h-9 rounded-lg border border-border-default bg-surface-muted px-2.5 text-sm"
              >
                {Object.values(TicketStatus).map((value) => (
                  <option key={value} value={value}>
                    {humaniseEnum(value)}
                  </option>
                ))}
              </select>

              <select
                aria-label="Priority"
                value={current.priority}
                onChange={(event) =>
                  priority
                    .mutateAsync({
                      id: current.id,
                      data: { priority: event.target.value as TicketPriority },
                    })
                    .then(() => toast.success("Priority updated."))
                    .catch(() => toast.error("Could not update the priority."))
                }
                className="h-9 rounded-lg border border-border-default bg-surface-muted px-2.5 text-sm"
              >
                {Object.values(TicketPriority).map((value) => (
                  <option key={value} value={value}>
                    {humaniseEnum(value)}
                  </option>
                ))}
              </select>
            </div>

            <ModalBody className="flex max-h-[45vh] flex-col gap-3 overflow-y-auto">
              {current.messages.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex flex-col gap-1 rounded-[var(--radius-card)] p-3.5",
                    entry.isInternal
                      ? "border border-dashed border-warning/40 bg-warning-soft/40"
                      : entry.fromCustomer
                        ? "bg-surface-muted"
                        : "bg-brand-soft",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-secondary">
                      <User className="size-3" />
                      {entry.senderName}
                      {entry.isInternal && (
                        <span className="rounded-full bg-warning px-1.5 py-0.5 text-[10px] font-bold text-white">
                          Internal
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted">{formatRelative(entry.createdAt)}</span>
                  </div>
                  <p className="text-sm text-primary">{entry.message}</p>
                </div>
              ))}
            </ModalBody>

            <form onSubmit={send}>
              <ModalFooter className="flex-col items-stretch gap-3">
                <Textarea
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={internal ? "A note for other staff, not the customer…" : "Reply to the customer…"}
                />
                <div className="flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary">
                    <input
                      type="checkbox"
                      checked={internal}
                      onChange={(event) => setInternal(event.target.checked)}
                      className="size-4 accent-[var(--brand)]"
                    />
                    Internal note
                  </label>
                  <Button type="submit" loading={reply.isPending} disabled={!hasText(message)}>
                    <Send className="size-4" />
                    {internal ? "Add note" : "Send reply"}
                  </Button>
                </div>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
