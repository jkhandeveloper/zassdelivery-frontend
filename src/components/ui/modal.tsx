"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Centred modal. §2 asks for a spring open; Radix drives the mount/unmount, so
 * the spring is expressed as a short CSS animation on its data-state hooks —
 * cheaper than mounting Framer Motion inside every dialog, and it cannot get
 * out of sync with Radix's own focus handling.
 */

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;

export function ModalContent({
  className,
  children,
  size = "md",
  showClose = true,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
  size?: "sm" | "md" | "lg" | "xl";
  showClose?: boolean;
}) {
  const widths = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  } as const;

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
          "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
          widths[size],
          "max-h-[calc(100vh-3rem)] overflow-y-auto",
          "rounded-[var(--radius-panel)] border border-border-subtle bg-surface shadow-panel",
          "data-[state=open]:animate-[zass-modal-in_260ms_cubic-bezier(0.16,1,0.3,1)]",
          "data-[state=closed]:animate-[zass-fade-out_150ms_ease-in]",
          className,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <Dialog.Close
            aria-label="Close"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-primary"
          >
            <X className="size-5" />
          </Dialog.Close>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function ModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-6 pb-4 pr-14", className)} {...props} />;
}

export function ModalTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Title>) {
  return (
    <Dialog.Title className={cn("font-display text-2xl font-extrabold", className)} {...props} />
  );
}

export function ModalDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Description>) {
  return <Dialog.Description className={cn("text-secondary", className)} {...props} />;
}

export function ModalBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-2", className)} {...props} />;
}

export function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-border-subtle bg-surface p-6",
        className,
      )}
      {...props}
    />
  );
}
