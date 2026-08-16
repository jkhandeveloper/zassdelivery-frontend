"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * §10: skeletons only — never a spinner, never the string "Loading…".
 *
 * Each variant matches the shape of the thing it stands in for, so the page
 * does not reflow when real content lands.
 */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("skeleton-sheen rounded-lg bg-[var(--skeleton-base)]", className)}
      {...props}
    />
  );
}

/** Wraps a skeleton block so screen readers announce the wait once. */
export function SkeletonRegion({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-center gap-3 pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  );
}

export function RestaurantGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <SkeletonRegion
      label="Loading restaurants"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <RestaurantCardSkeleton key={index} />
      ))}
    </SkeletonRegion>
  );
}

export function FoodCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-2/5" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="size-9 rounded-full" />
      </div>
    </div>
  );
}

export function MenuGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonRegion
      label="Loading menu"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: count }, (_, index) => (
        <FoodCardSkeleton key={index} />
      ))}
    </SkeletonRegion>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4">
      <Skeleton className="size-16 shrink-0 rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-5 w-20 shrink-0" />
    </div>
  );
}

export function ListSkeleton({ count = 5, label = "Loading" }: { count?: number; label?: string }) {
  return (
    <SkeletonRegion label={label} className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, index) => (
        <ListRowSkeleton key={index} />
      ))}
    </SkeletonRegion>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-3 w-3/4" />
      <div className="flex items-center justify-between border-t border-border-subtle pt-4">
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function CartRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-border-subtle py-4 last:border-0">
      <Skeleton className="size-20 shrink-0 rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-10 w-28 rounded-xl" />
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border-subtle">
      {Array.from({ length: columns }, (_, index) => (
        <td key={index} className="px-4 py-4">
          <Skeleton className={cn("h-4", index === 0 ? "w-40" : "w-24")} />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }, (_, index) => (
        <TableRowSkeleton key={index} columns={columns} />
      ))}
    </tbody>
  );
}

export function StatTileSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonRegion
      label="Loading statistics"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <StatTileSkeleton key={index} />
      ))}
    </SkeletonRegion>
  );
}

export function AvatarSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("size-11 rounded-full", className)} />;
}

export function ProfileSkeleton() {
  return (
    <SkeletonRegion label="Loading profile" className="flex flex-col gap-6">
      <div className="flex items-center gap-5 rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-6">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-[var(--radius-card)]" />
        ))}
      </div>
    </SkeletonRegion>
  );
}
