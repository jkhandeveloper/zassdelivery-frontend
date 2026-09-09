"use client";

import {
  Bell,
  BellOff,
  CheckCheck,
  LifeBuoy,
  Megaphone,
  Package,
  Settings2,
  Trash2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Badge } from "@/components/ui/status-pill";
import {
  useClearReadNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "@/hooks/use-notifications";
import { ApiError } from "@/lib/api-client";
import { cn, formatCount, formatDateTime, formatRelative, hasText } from "@/lib/utils";
import { NotificationType } from "@/types/enums";
import type { NotificationDto } from "@/types/notification";

const PAGE_SIZE = 20;

/** How each category reads and looks in the list. */
const CATEGORIES: Record<
  NotificationType,
  { label: string; icon: React.ReactNode; tone: string }
> = {
  [NotificationType.ORDER_UPDATE]: {
    label: "Order",
    icon: <Package className="size-4" />,
    tone: "bg-brand-soft text-brand",
  },
  [NotificationType.PROMOTION]: {
    label: "Offer",
    icon: <Megaphone className="size-4" />,
    tone: "bg-accent-warm-soft text-accent-warm",
  },
  [NotificationType.WALLET]: {
    label: "Wallet",
    icon: <Wallet className="size-4" />,
    tone: "bg-accent-gold-soft text-accent-gold",
  },
  [NotificationType.SUPPORT]: {
    label: "Support",
    icon: <LifeBuoy className="size-4" />,
    tone: "bg-accent-violet-soft text-accent-violet",
  },
  [NotificationType.SYSTEM]: {
    label: "Account",
    icon: <Settings2 className="size-4" />,
    tone: "bg-surface-muted text-secondary",
  },
};

const FILTERS: readonly { key: string; label: string; type?: NotificationType }[] = [
  { key: "all", label: "Everything" },
  { key: NotificationType.ORDER_UPDATE, label: "Orders", type: NotificationType.ORDER_UPDATE },
  { key: NotificationType.PROMOTION, label: "Offers", type: NotificationType.PROMOTION },
  { key: NotificationType.WALLET, label: "Wallet", type: NotificationType.WALLET },
  { key: NotificationType.SUPPORT, label: "Support", type: NotificationType.SUPPORT },
  { key: NotificationType.SYSTEM, label: "Account", type: NotificationType.SYSTEM },
];

/**
 * Where a notification leads, taken from the payload the API attached to it —
 * order notices carry `orderId`. Anything without a destination stays a
 * message rather than becoming a link that goes nowhere.
 */
function destinationOf(notification: NotificationDto): string | null {
  const orderId = notification.data?.["orderId"];

  if (notification.type === NotificationType.ORDER_UPDATE && typeof orderId === "string") {
    return `/orders/${orderId}`;
  }

  if (notification.type === NotificationType.SUPPORT) {
    return "/support";
  }

  return null;
}

function NotificationRow({ notification }: { notification: NotificationDto }) {
  const markRead = useMarkNotificationRead();
  const remove = useDeleteNotification();

  const category = CATEGORIES[notification.type] ?? CATEGORIES[NotificationType.SYSTEM];
  const unread = !hasText(notification.readAt);
  const href = destinationOf(notification);

  // Opening one is what marks it read — the same tap on the phone. Already-read
  // notifications are left alone rather than re-posting an idempotent write.
  const open = () => {
    if (unread) {
      markRead.mutate(notification.id);
    }
  };

  const title = (
    <span className="font-display text-[0.9375rem] font-extrabold text-primary">
      {notification.title}
    </span>
  );

  return (
    <li
      className={cn(
        "flex items-start gap-4 rounded-[var(--radius-card)] border p-4 shadow-card transition-colors sm:p-5",
        unread ? "border-brand/30 bg-brand-soft/40" : "border-border-subtle bg-surface",
      )}
    >
      <span
        aria-hidden
        className={cn("grid size-10 shrink-0 place-items-center rounded-xl", category.tone)}
      >
        {category.icon}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          {href !== null ? (
            <Link href={href} onClick={open} className="hover:text-brand">
              {title}
            </Link>
          ) : (
            title
          )}

          {unread && (
            <span
              aria-label="Unread"
              className="size-2 shrink-0 rounded-full bg-brand"
              role="status"
            />
          )}
        </div>

        <p className="text-sm leading-relaxed text-secondary">{notification.body}</p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge size="sm" variant="outline">
            {category.label}
          </Badge>
          <time
            dateTime={notification.createdAt}
            title={formatDateTime(notification.createdAt)}
            className="numeric text-xs text-muted"
          >
            {formatRelative(notification.createdAt)}
          </time>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {unread && (
          <Button
            variant="ghost"
            size="sm"
            loading={markRead.isPending}
            onClick={() => markRead.mutate(notification.id)}
          >
            <CheckCheck aria-hidden className="size-4" />
            <span className="hidden sm:inline">Mark read</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          aria-label="Delete notification"
          className="text-danger hover:bg-danger-soft"
          loading={remove.isPending}
          onClick={() =>
            remove.mutate(notification.id, {
              onError: (error) =>
                toast.error(
                  error instanceof ApiError ? error.message : "We couldn't delete that.",
                ),
            })
          }
        >
          <Trash2 aria-hidden className="size-4" />
        </Button>
      </div>
    </li>
  );
}

/**
 * The notification history from §5.7.
 *
 * The in-app record exists whether or not a push went out, so this list — not
 * the phone's notification tray — is the account's own record of what happened.
 */
export function NotificationsView() {
  const { isAuthenticated, isReady } = useAuth();
  const signedIn = isReady && isAuthenticated;

  const [filter, setFilter] = React.useState<string>("all");
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const active = FILTERS.find((item) => item.key === filter) ?? FILTERS[0];

  const query = useNotifications(
    {
      limit: PAGE_SIZE,
      page,
      ...(active?.type !== undefined && { type: active.type }),
      ...(unreadOnly && { unreadOnly: true }),
    },
    signedIn,
  );

  const unread = useUnreadCount(signedIn);
  const markAll = useMarkAllNotificationsRead();
  const clearRead = useClearReadNotifications();

  if (isReady && !isAuthenticated) {
    return (
      <EmptyState
        icon={<Bell className="size-8" />}
        title="Sign in to see your notifications"
        description="Order updates, offers and account notices are kept on your account."
        action={
          <Button asChild>
            <Link href="/login?next=%2Fnotifications">Sign in</Link>
          </Button>
        }
      />
    );
  }

  const unreadTotal = unread.data?.total ?? 0;
  const items = query.data?.items ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-secondary">
          {unreadTotal > 0 ? (
            <>
              <span className="numeric font-bold text-primary">{formatCount(unreadTotal)}</span>{" "}
              unread
            </>
          ) : (
            "You're all caught up."
          )}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={unreadTotal === 0}
            loading={markAll.isPending}
            onClick={() =>
              markAll.mutate(undefined, {
                onSuccess: (result) =>
                  toast.success(
                    result.updated === 0
                      ? "Nothing left to mark"
                      : `${formatCount(result.updated)} marked as read`,
                  ),
                onError: () => toast.error("We couldn't mark those as read."),
              })
            }
          >
            <CheckCheck aria-hidden className="size-4" />
            Mark all as read
          </Button>

          <Button
            variant="ghost"
            size="sm"
            loading={clearRead.isPending}
            onClick={() =>
              // Only what has been read is cleared, so this cannot quietly
              // discard something the account has not seen yet.
              clearRead.mutate(undefined, {
                onSuccess: (result) =>
                  toast.success(
                    result.deleted === 0
                      ? "Nothing to clear"
                      : `${formatCount(result.deleted)} cleared`,
                  ),
                onError: () => toast.error("We couldn't clear those."),
              })
            }
          >
            <Trash2 aria-hidden className="size-4" />
            Clear read
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={filter === item.key}
            onClick={() => {
              // Page 3 of orders means nothing in offers.
              setFilter(item.key);
              setPage(1);
            }}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[0.8125rem] font-bold transition-colors",
              filter === item.key
                ? "border-brand bg-brand-soft text-brand"
                : "border-border-subtle text-secondary hover:border-border-strong hover:text-primary",
            )}
          >
            {item.label}
          </button>
        ))}

        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm font-semibold text-secondary">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) => {
              setUnreadOnly(event.target.checked);
              setPage(1);
            }}
            className="size-4 accent-[var(--brand)]"
          />
          Unread only
        </label>
      </div>

      {!isReady || query.isPending ? (
        <ListSkeleton count={5} label="Loading your notifications" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BellOff className="size-8" />}
          title={unreadOnly ? "Nothing unread" : "No notifications yet"}
          description={
            unreadOnly
              ? "Everything here has been read."
              : "Order updates, offers and account notices will land here as they happen."
          }
          action={
            <Button asChild>
              <Link href="/restaurants">Browse restaurants</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {items.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </ul>

          {(query.data?.meta.totalPages ?? 1) > 1 && (
            <nav className="flex items-center justify-center gap-4 pt-2" aria-label="Pagination">
              <Button
                variant="outline"
                disabled={query.data?.meta.hasPreviousPage !== true}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span className="numeric text-sm text-secondary">
                Page {query.data?.meta.page} of {query.data?.meta.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={query.data?.meta.hasNextPage !== true}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
