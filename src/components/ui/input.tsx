"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const fieldBase = [
  "w-full rounded-[var(--radius-input)] border bg-surface-muted text-primary",
  "placeholder:text-muted transition-all duration-200",
  "focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-[var(--brand-ring)]",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

/** Label + control + one message slot, so every field reads identically. */
export function Field({
  label,
  hint,
  error,
  success,
  required,
  htmlFor,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label !== undefined && (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-primary">
          {label}
          {required === true && (
            <span aria-hidden className="ml-0.5 text-brand">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error !== undefined ? (
        <p className="text-sm font-medium text-danger">{error}</p>
      ) : success !== undefined ? (
        <p className="text-sm font-medium text-success">{success}</p>
      ) : hint !== undefined ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Rendered inside the field, before the text. */
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export function Input({ className, invalid, leadingIcon, trailingIcon, ...props }: InputProps) {
  const control = (
    <input
      className={cn(
        fieldBase,
        "h-12 px-4 text-[0.9375rem]",
        leadingIcon !== undefined && "pl-11",
        trailingIcon !== undefined && "pr-11",
        invalid === true
          ? "border-danger focus:border-danger focus:ring-[rgb(220_38_38/0.25)]"
          : "border-border-default",
        className,
      )}
      aria-invalid={invalid === true || undefined}
      {...props}
    />
  );

  if (leadingIcon === undefined && trailingIcon === undefined) {
    return control;
  }

  return (
    <div className="relative">
      {leadingIcon !== undefined && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        >
          {leadingIcon}
        </span>
      )}
      {control}
      {trailingIcon !== undefined && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">{trailingIcon}</span>
      )}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        fieldBase,
        "min-h-28 resize-y px-4 py-3 text-[0.9375rem] leading-relaxed",
        invalid === true ? "border-danger" : "border-border-default",
        className,
      )}
      aria-invalid={invalid === true || undefined}
      {...props}
    />
  );
}

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/**
 * A plain <select>, for the many small filter dropdowns.
 * Richer, searchable menus use the Radix Select in `select.tsx`.
 */
export function NativeSelect({ className, invalid, children, ...props }: NativeSelectProps) {
  return (
    <select
      className={cn(
        fieldBase,
        "h-12 cursor-pointer appearance-none px-4 pr-10 text-[0.9375rem]",
        "bg-[image:var(--select-caret)] bg-[length:18px] bg-[position:right_0.9rem_center] bg-no-repeat",
        invalid === true ? "border-danger" : "border-border-default",
        className,
      )}
      style={{
        // Inlined so the caret picks up the current text colour in both themes.
        ["--select-caret" as string]:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239a9089' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      aria-invalid={invalid === true || undefined}
      {...props}
    >
      {children}
    </select>
  );
}
