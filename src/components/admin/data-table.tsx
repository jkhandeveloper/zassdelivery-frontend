"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { cn, formatCount } from "@/lib/utils";
import type { PaginationMeta } from "@/types/api";

/**
 * The one table every admin list is built from.
 *
 * Eight screens show a filtered, paginated list of records with a few actions
 * on each row. Writing eight tables is how the users screen ends up with a
 * different empty state, a different loading behaviour and a different idea of
 * what page 1 means than the riders screen next to it.
 *
 * The loading, error and empty branches live here for the same reason: they are
 * the three states a list is in most of the time, and the ones most likely to
 * be skipped when each screen implements its own.
 */

export interface Column<T> {
  /** Stable id — also the React key for the cell. */
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  /** Hides the column below the given breakpoint, e.g. "sm" or "lg". */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** For a column of actions: keeps it from being squeezed. */
  width?: string;
}

export interface DataTableProps<T> {
  columns: readonly Column<T>[];
  rows: readonly T[] | undefined;
  rowKey: (row: T) => string;
  isPending: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Shown when the request succeeded and returned nothing. */
  empty: { title: string; description?: string; icon?: React.ReactNode };
  /** Describes the table to a screen reader. */
  caption: string;
  /** Rendered under the last row — pagination, usually. */
  footer?: React.ReactNode;
  /** Called when a row is clicked. Makes rows keyboard-focusable too. */
  onRowClick?: (row: T) => void;
}

const HIDE_BELOW: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

const ALIGN = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isPending,
  isError = false,
  error,
  onRetry,
  empty,
  caption,
  footer,
  onRowClick,
}: DataTableProps<T>) {
  if (isError) {
    return <ErrorState density="inline" error={error} onRetry={onRetry} />;
  }

  if (!isPending && (rows === undefined || rows.length === 0)) {
    return (
      <EmptyState
        density="inline"
        icon={empty.icon}
        title={empty.title}
        description={empty.description}
      />
    );
  }

  return (
    <div className="flex flex-col">
      {/* Wide tables scroll inside their own box; the page never scrolls sideways. */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border-subtle">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width === undefined ? undefined : { width: column.width }}
                  className={cn(
                    "px-4 py-3 text-xs font-bold tracking-wide text-muted uppercase whitespace-nowrap",
                    ALIGN[column.align ?? "left"],
                    column.hideBelow !== undefined && HIDE_BELOW[column.hideBelow],
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          {isPending ? (
            <TableSkeleton rows={6} columns={columns.length} />
          ) : (
            <tbody>
              {(rows ?? []).map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick === undefined ? undefined : () => onRowClick(row)}
                  className={cn(
                    "border-b border-border-subtle last:border-0",
                    onRowClick !== undefined &&
                      "cursor-pointer transition-colors hover:bg-surface-muted",
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3.5 align-middle",
                        ALIGN[column.align ?? "left"],
                        column.hideBelow !== undefined && HIDE_BELOW[column.hideBelow],
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {footer}
    </div>
  );
}

/**
 * Page controls for a list.
 *
 * Driven by the API's own `meta` rather than by counting rows: the server knows
 * whether there is a next page, and a client that infers it from `items.length
 * === limit` is wrong exactly when the total is a multiple of the page size.
 */
export function Pagination({
  meta,
  onPageChange,
  className,
}: {
  meta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (meta === undefined || meta.total === 0) {
    return null;
  }

  const first = (meta.page - 1) * meta.limit + 1;
  const last = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-4 py-3",
        className,
      )}
    >
      <p className="numeric text-xs text-muted">
        {formatCount(first)}–{formatCount(last)} of {formatCount(meta.total)}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasPreviousPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <span className="numeric px-1 text-xs text-secondary">
          {meta.page} / {Math.max(1, meta.totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/** Two lines in one cell — a name over its identifier, a place over its zone. */
export function CellStack({
  primary,
  secondary,
}: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate font-semibold text-primary">{primary}</span>
      {secondary !== undefined && (
        <span className="truncate text-xs text-muted">{secondary}</span>
      )}
    </div>
  );
}

/** The right-hand actions cell, so button spacing is identical across screens. */
export function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-2">{children}</div>;
}
