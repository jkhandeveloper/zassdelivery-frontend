"use client";

import * as React from "react";

import { cn, formatCount } from "@/lib/utils";

export interface TabDefinition<T extends string> {
  value: T;
  label: string;
  /** Shown as a pill after the label. Omit for tabs with nothing to count. */
  count?: number;
}

/**
 * The segmented switch above a multi-section admin screen.
 *
 * Real tabs semantically — `role="tablist"` with arrow-key movement — because
 * these switch between views of the same subject. A row of links would put each
 * section in the history and make the back button walk sideways through them.
 */
export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: readonly TabDefinition<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers — "Payments sections". */
  label: string;
  className?: string;
}) {
  const refs = React.useRef(new Map<T, HTMLButtonElement>());

  function move(direction: 1 | -1) {
    const index = tabs.findIndex((tab) => tab.value === value);
    const next = tabs[(index + direction + tabs.length) % tabs.length];

    if (next !== undefined) {
      onChange(next.value);
      refs.current.get(next.value)?.focus();
    }
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
      }}
      className={cn(
        "flex w-full gap-1 overflow-x-auto rounded-[var(--radius-input)] bg-surface-muted p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;

        return (
          <button
            key={tab.value}
            ref={(element) => {
              if (element === null) {
                refs.current.delete(tab.value);
              } else {
                refs.current.set(tab.value, element);
              }
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-[10px] px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              selected
                ? "bg-surface text-primary shadow-card"
                : "text-secondary hover:text-primary",
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "numeric rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  selected ? "bg-brand-soft text-brand" : "bg-surface-sunken text-muted",
                )}
              >
                {formatCount(tab.count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
