"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/**
 * The shared furniture of a portal screen: a title block, stat tiles and a
 * panel. The three portals reuse these rather than each inventing their own
 * heading rhythm, which is how a "Today" page and an "Order queue" page end up
 * looking like two different products.
 */

export function PortalHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        {description !== undefined && (
          <p className="max-w-2xl text-[0.9375rem] text-secondary">{description}</p>
        )}
      </div>
      {action !== undefined && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "neutral" | "brand" | "warm" | "success";
}) {
  const tones = {
    neutral: "bg-surface-muted text-secondary",
    brand: "bg-brand-soft text-brand",
    warm: "bg-accent-warm-soft text-accent-warm",
    success: "bg-success-soft text-success",
  } as const;

  return (
    <Card className="flex flex-col gap-3 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-secondary">{label}</p>
        {icon !== undefined && (
          <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-xl", tones[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p className="numeric font-display text-3xl font-extrabold text-primary">{value}</p>
      {hint !== undefined && <p className="text-xs text-muted">{hint}</p>}
    </Card>
  );
}

export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-[var(--radius-panel)] border border-border-subtle bg-surface shadow-card",
        className,
      )}
    >
      {title !== undefined && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle p-5 sm:p-6">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="font-display text-lg font-extrabold text-primary">{title}</h2>
            {description !== undefined && (
              <p className="text-sm text-secondary">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}
