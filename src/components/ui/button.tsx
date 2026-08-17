"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-semibold transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
    "disabled:pointer-events-none disabled:opacity-50",
    // §2 motion: lift on hover, press to 0.97.
    "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]",
    "motion-reduce:transform-none motion-reduce:transition-none",
  ],
  {
    variants: {
      variant: {
        // The glow is the hover reward across the solid variants — it is what
        // makes a neon palette feel lit rather than merely dark.
        primary: "bg-brand text-brand-contrast shadow-card hover:bg-brand-hover hover:shadow-glow",
        secondary:
          "bg-accent-warm text-white shadow-card hover:bg-zass-secondary-hover hover:shadow-glow-warm dark:text-[#2a1204]",
        outline:
          "border border-border-strong bg-transparent text-primary hover:border-brand hover:bg-brand-soft hover:text-brand",
        ghost: "bg-transparent text-secondary hover:bg-surface-muted hover:text-primary",
        danger: "bg-danger text-white shadow-card hover:brightness-110 dark:text-[#2a0d12]",
        success: "bg-success text-white shadow-card hover:brightness-110 dark:text-[#04231a]",
        gradient:
          "gradient-brand text-white shadow-card hover:shadow-glow hover:brightness-105 dark:text-[#04202b]",
        /** The wheel's centre CTA: orange ring, warm bloom. */
        neon: "gradient-warm text-white shadow-card hover:shadow-glow-warm hover:brightness-105 dark:text-[#2a1204]",
      },
      size: {
        sm: "h-9 rounded-[10px] px-3.5 text-sm",
        md: "h-11 rounded-[var(--radius-input)] px-5 text-[0.9375rem]",
        lg: "h-13 rounded-[var(--radius-input)] px-7 text-base",
        icon: "size-11 rounded-[var(--radius-input)]",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  /** Announced to screen readers while `loading`. */
  loadingLabel?: string;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  loadingLabel = "Working…",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          <span className="sr-only">{loadingLabel}</span>
          {/* The label stays put so the button does not resize mid-action. */}
          <span aria-hidden>{children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { buttonVariants };
