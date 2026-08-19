"use client";

import { ArrowLeft, LifeBuoy, MessageSquarePlus, Send } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { ListSkeleton, Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { useCreateTicket, useReplyToTicket, useTicket, useTickets } from "@/hooks/use-support";
import { ApiError } from "@/lib/api-client";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";
import { TicketCategory } from "@/types/enums";
import type { TicketDto } from "@/types/support";

/** Category labels, for people. The API names them in SCREAMING_SNAKE. */
const CATEGORY_LABELS: Record<string, string> = {
  [TicketCategory.ORDER_ISSUE]: "A problem with an order",
  [TicketCategory.PAYMENT_ISSUE]: "Payment or refund",
  [TicketCategory.DELIVERY_ISSUE]: "Delivery or pickup",
  [TicketCategory.ACCOUNT]: "My account",
  [TicketCategory.RESTAURANT_COMPLAINT]: "A restaurant",
  [TicketCategory.OTHER]: "Something else",
};

/**
 * Support, shared by the customer, rider and vendor portals.
 *
 * One component for all three because `GET /support-tickets` is already scoped
 * by the API to what the caller may see — the screens differ only in the shell
 * around them, and three copies of a message thread is three places for a reply
 * box to drift.
 */
export function SupportView({
  title = "Support",
  description = "Raise a ticket and follow the conversation. We answer in the order they arrive.",
  /** Categories worth offering this audience; omit for all of them. */
  categories,
}: {
  title?: string;
  description?: string;
  categories?: readonly TicketCategory[];
}) {
  const [openTicketId, setOpenTicketId] = React.useState<string | null>(null);
  const [composing, setComposing] = React.useState(false);

  const tickets = useTickets({ limit: 25, sortBy: "createdAt", sortOrder: "desc" });

  if (openTicketId !== null) {
    return <TicketThread id={openTicketId} onBack={() => setOpenTicketId(null)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title={title}
        description={description}
        action={
          !composing && (
            <Button onClick={() => setComposing(true)}>
              <MessageSquarePlus className="size-4" />
              New ticket
            </Button>
          )
        }
      />

      {composing && (
        <NewTicketForm
          categories={categories}
          onCancel={() => setComposing(false)}
          onCreated={(ticket) => {
            setComposing(false);
            setOpenTicketId(ticket.id);
          }}
        />
      )}

      {tickets.isPending ? (
        <ListSkeleton label="Loading your tickets" count={3} />
      ) : tickets.isError ? (
        <ErrorState error={tickets.error} onRetry={() => void tickets.refetch()} />
      ) : tickets.data.items.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy className="size-8" />}
          title="No tickets yet"
          description="When something goes wrong, open a ticket here and we'll pick it up."
          action={
            !composing && (
              <Button onClick={() => setComposing(true)}>
                <MessageSquarePlus className="size-4" />
                Open a ticket
              </Button>
            )
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {tickets.data.items.map((ticket) => (
            <li key={ticket.id}>
              <button
                type="button"
                onClick={() => setOpenTicketId(ticket.id)}
                className="flex w-full flex-col gap-2.5 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 text-left shadow-card transition-colors hover:border-brand/40 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate font-bold text-primary">{ticket.subject}</span>
                    <span className="numeric text-xs text-muted">
                      {ticket.ticketNumber}
                      {ticket.orderNumber !== null && <> · order {ticket.orderNumber}</>}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusPill status={ticket.priority} size="sm" />
                    <StatusPill status={ticket.status} size="sm" withDot />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span>{CATEGORY_LABELS[ticket.category] ?? ticket.category}</span>
                  <span aria-hidden>·</span>
                  <span>
                    {ticket.messageCount} {ticket.messageCount === 1 ? "message" : "messages"}
                  </span>
                  <span aria-hidden>·</span>
                  <span>Updated {formatRelative(ticket.updatedAt)}</span>
                  {ticket.assignedToName !== null && (
                    <>
                      <span aria-hidden>·</span>
                      <span>With {ticket.assignedToName}</span>
                    </>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewTicketForm({
  categories,
  onCancel,
  onCreated,
}: {
  categories?: readonly TicketCategory[];
  onCancel: () => void;
  onCreated: (ticket: TicketDto) => void;
}) {
  const create = useCreateTicket();
  const options = categories ?? (Object.values(TicketCategory) as TicketCategory[]);

  const [category, setCategory] = React.useState<TicketCategory>(options[0]);
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");

  // The API enforces these minimums; matching them here turns a 400 round-trip
  // into a disabled button.
  const canSubmit = subject.trim().length >= 5 && message.trim().length >= 5;

  return (
    <Panel title="Open a ticket" description="Tell us what happened and we'll take it from there.">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;

          create.mutate(
            { category, subject: subject.trim(), message: message.trim() },
            {
              onSuccess: (ticket) => {
                toast.success(`Ticket ${ticket.ticketNumber} opened`);
                onCreated(ticket);
              },
              onError: (error) =>
                toast.error(
                  error instanceof ApiError ? error.message : "We couldn't open that ticket.",
                ),
            },
          );
        }}
      >
        <Field label="What's it about?" htmlFor="ticket-category" required>
          <NativeSelect
            id="ticket-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as TicketCategory)}
          >
            {options.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABELS[value] ?? value}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Subject" htmlFor="ticket-subject" required hint="A short summary.">
          <Input
            id="ticket-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Two items were missing from my order"
            maxLength={200}
            required
          />
        </Field>

        <Field label="What happened?" htmlFor="ticket-message" required>
          <Textarea
            id="ticket-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Give us the details — order number, what went wrong, what you'd like done."
            maxLength={4000}
            className="min-h-32"
            required
          />
        </Field>

        <div className="flex gap-2">
          <Button type="submit" loading={create.isPending} disabled={!canSubmit}>
            Send to support
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function TicketThread({ id, onBack }: { id: string; onBack: () => void }) {
  const ticket = useTicket(id);
  const reply = useReplyToTicket(id);
  const [message, setMessage] = React.useState("");

  if (ticket.isPending) {
    return (
      <SkeletonRegion label="Loading ticket" className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 rounded-[var(--radius-panel)]" />
      </SkeletonRegion>
    );
  }

  if (ticket.isError) {
    return <ErrorState error={ticket.error} onRetry={() => void ticket.refetch()} />;
  }

  const data = ticket.data;
  // A resolved or closed ticket is read-only; replying would silently reopen
  // something support believes it has finished with.
  const canReply = data.isOpen;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-brand transition-colors hover:text-brand-hover"
        >
          <ArrowLeft aria-hidden className="size-4" />
          All tickets
        </button>

        <PortalHeader
          title={data.subject}
          description={`${data.ticketNumber} · opened ${formatDateTime(data.createdAt)}`}
          action={
            <div className="flex items-center gap-2">
              <StatusPill status={data.priority} size="sm" />
              <StatusPill status={data.status} withDot />
            </div>
          }
        />
      </div>

      <Panel bodyClassName="flex flex-col gap-4">
        <ul className="flex flex-col gap-4">
          {data.messages
            // Internal notes are staff-only; the API sends them only to staff,
            // but a ticket read by an agent renders here too.
            .filter((entry) => !entry.isInternal)
            .map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  "flex flex-col gap-1.5 rounded-[var(--radius-card)] p-4",
                  entry.fromCustomer
                    ? "bg-brand-soft"
                    : "border border-border-subtle bg-surface-muted",
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-primary">
                    {entry.fromCustomer ? "You" : entry.senderName}
                  </span>
                  <span className="text-xs text-muted">{formatDateTime(entry.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-secondary">
                  {entry.message}
                </p>
              </li>
            ))}
        </ul>

        {canReply ? (
          <form
            className="flex flex-col gap-3 border-t border-border-subtle pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (message.trim() === "") return;

              reply.mutate(
                { message: message.trim() },
                {
                  onSuccess: () => setMessage(""),
                  onError: (error) =>
                    toast.error(
                      error instanceof ApiError ? error.message : "We couldn't send that reply.",
                    ),
                },
              );
            }}
          >
            <Field label="Reply" htmlFor="ticket-reply">
              <Textarea
                id="ticket-reply"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Add anything else that would help…"
                maxLength={4000}
              />
            </Field>
            <Button
              type="submit"
              className="self-start"
              loading={reply.isPending}
              disabled={message.trim() === ""}
            >
              <Send className="size-4" />
              Send reply
            </Button>
          </form>
        ) : (
          <p className="border-t border-border-subtle pt-4 text-sm text-muted">
            This ticket is {data.status.toLowerCase().replace(/_/g, " ")}. Open a new one if you
            still need help.
          </p>
        )}
      </Panel>
    </div>
  );
}
