"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The side panel §4 asks to reuse for cart, filters, notifications and the user
 * menu. One component, one set of animations, one focus trap — four features
 * that would otherwise drift apart.
 */

export const Drawer = Dialog.Root;
export const DrawerTrigger = Dialog.Trigger;
export const DrawerClose = Dialog.Close;

export function DrawerContent({
  className,
  children,
  side = "right",
  width = "md",
  title,
  description,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
  side?: "right" | "left";
  width?: "sm" | "md" | "lg";
  /** Required by Radix for an accessible name; pass `srOnlyTitle` styling if visually redundant. */
  title: string;
  description?: string;
}) {
  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" } as const;

  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-[rgb(23_16_13/0.55)] backdrop-blur-sm",
          "data-[state=open]:animate-[zass-fade-in_200ms_ease-out]",
          "data-[state=closed]:animate-[zass-fade-out_150ms_ease-in]",
        )}
      />
      <Dialog.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-full flex-col border-border-subtle bg-surface shadow-panel",
          widths[width],
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          side === "right"
            ? "data-[state=open]:animate-[zass-slide-in-right_280ms_cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-[zass-slide-out-right_200ms_ease-in]"
            : "data-[state=open]:animate-[zass-slide-in-left_280ms_cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-[zass-slide-out-left_200ms_ease-in]",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle p-5">
          <div className="flex flex-col gap-1">
            <Dialog.Title className="font-display text-xl font-extrabold">{title}</Dialog.Title>
            {description !== undefined && (
              <Dialog.Description className="text-sm text-secondary">
                {description}
              </Dialog.Description>
            )}
          </div>
          <Dialog.Close
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-primary"
          >
            <X className="size-5" />
          </Dialog.Close>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-t border-border-subtle bg-surface p-5", className)}
      {...props}
    />
  );
}
