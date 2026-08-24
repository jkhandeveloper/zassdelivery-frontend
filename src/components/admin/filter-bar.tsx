"use client";

import { Search, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { useValueChanged } from "@/hooks/use-value-changed";
import { cn } from "@/lib/utils";

/**
 * The filter row above an admin list.
 *
 * One component so search sits in the same place, at the same height, on every
 * screen — and so "clear" always means the same thing.
 */
export function FilterBar({
  children,
  onClear,
  className,
}: {
  children: React.ReactNode;
  /** Shown only when something is actually filtered. */
  onClear?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {children}
      {onClear !== undefined && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

/**
 * Search that does not fire on every keystroke.
 *
 * Debounced locally and reported upward, so the input stays responsive while
 * the list refetches at most once every 350ms — a search box wired straight to
 * a query key issues a request per character.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = React.useState(value);

  // Keeps the box in step when the value is reset from outside — "Clear".
  if (useValueChanged(value) && draft !== value) {
    setDraft(value);
  }

  React.useEffect(() => {
    if (draft === value) {
      return;
    }

    const timer = setTimeout(() => onChange(draft), 350);

    return () => clearTimeout(timer);
  }, [draft, value, onChange]);

  return (
    <div className={cn("relative min-w-0 flex-1 sm:max-w-xs", className)}>
      <Input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        leadingIcon={<Search className="size-4" />}
      />
    </div>
  );
}

/**
 * A labelled dropdown filter.
 *
 * The empty string is the "all" option: a filter that has to distinguish
 * "unset" from "set to nothing" gets that wrong on the first refactor, so the
 * caller maps `""` to `undefined` when building the query.
 */
export function SelectFilter<T extends string>({
  label,
  value,
  onChange,
  options,
  allLabel = "All",
  className,
}: {
  label: string;
  value: T | "";
  onChange: (value: T | "") => void;
  options: readonly { value: T; label: string }[];
  allLabel?: string;
  className?: string;
}) {
  return (
    <NativeSelect
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value as T | "")}
      className={cn("h-11 w-auto min-w-[10rem] text-sm", className)}
    >
      <option value="">{allLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </NativeSelect>
  );
}

/** Turns an enum object into `SelectFilter` options with readable labels. */
export function enumOptions<T extends Record<string, string>>(
  source: T,
  label: (value: T[keyof T]) => string,
): readonly { value: T[keyof T]; label: string }[] {
  return Object.values(source).map((value) => ({
    value: value as T[keyof T],
    label: label(value as T[keyof T]),
  }));
}

/** SCREAMING_SNAKE → "Sentence case", for enum values with no nicer name. */
export function humaniseEnum(value: string): string {
  const words = value.toLowerCase().replace(/_/g, " ");

  return words.charAt(0).toUpperCase() + words.slice(1);
}
