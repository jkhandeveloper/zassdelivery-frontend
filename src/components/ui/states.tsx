"use client";

import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import * as React from "react";

import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { Button } from "./button";

/**
 * §10's empty and error states.
 *
 * Both take the same shape — icon, heading, one line, one action — so a list
 * that has nothing to show and a list that failed to load feel like the same
 * product rather than two different ones.
 */

interface StateShellProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** `page` gets more vertical room; `inline` sits inside a card or panel. */
  density?: "page" | "inline";
}

function StateShell({
  icon,
  title,
  description,
  action,
  className,
  density = "page",
}: StateShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        density === "page" ? "gap-4 px-6 py-20" : "gap-3 px-4 py-10",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "grid place-items-center rounded-full bg-surface-muted text-muted",
          density === "page" ? "size-20" : "size-14",
        )}
      >
        {icon}
      </div>
      <div className="flex max-w-md flex-col gap-1.5">
        <h3 className={cn("font-display font-extrabold", density === "page" ? "text-2xl" : "text-lg")}>
          {title}
        </h3>
        {description !== undefined && (
          <p className="text-[0.9375rem] leading-relaxed text-secondary">{description}</p>
        )}
      </div>
      {action !== undefined && <div className="pt-1">{action}</div>}
    </div>
  );
}

export interface EmptyStateProps extends Omit<StateShellProps, "icon"> {
  icon?: React.ReactNode;
}

export function EmptyState({ icon, ...props }: EmptyStateProps) {
  return <StateShell icon={icon ?? <span className="text-3xl">🍽️</span>} {...props} />;
}

export interface ErrorStateProps {
  /** The rejection as thrown by the API client. */
  error?: unknown;
  /** Overrides the message derived from `error`. */
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  density?: "page" | "inline";
}

/**
 * Copy is chosen from the error's `code` (§0/§10) rather than its message text,
 * with the API's own message as the fallback — it is written for humans and is
 * usually better than anything generic we could substitute.
 */
export function ErrorState({
  error,
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  className,
  density = "page",
}: ErrorStateProps) {
  const apiError = error instanceof ApiError ? error : null;
  const offline = apiError?.isNetworkError === true;

  const heading =
    title ??
    (offline
      ? "Check your internet connection"
      : apiError?.status === 404
        ? "We couldn't find that"
        : "Something went wrong");

  const body =
    description ??
    (offline
      ? "We couldn't reach ZassDelivery. Once you're back online, try again."
      : (apiError?.message ?? "An unexpected error stopped this from loading."));

  return (
    <StateShell
      className={className}
      density={density}
      icon={
        offline ? (
          <WifiOff className="size-8 text-danger" />
        ) : (
          <AlertTriangle className="size-8 text-danger" />
        )
      }
      title={heading}
      description={body}
      action={
        onRetry !== undefined ? (
          <div className="flex flex-col items-center gap-2">
            <Button variant="primary" onClick={onRetry}>
              <RefreshCw className="size-4" />
              {retryLabel}
            </Button>
            {/* Support cannot find anything without this. */}
            {apiError?.requestId !== null && apiError?.requestId !== undefined && (
              <p className="numeric text-xs text-muted">Reference: {apiError.requestId}</p>
            )}
          </div>
        ) : undefined
      }
    />
  );
}
