"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { qrCodeName } from "@/lib/payment-labels";
import { cn, hasText } from "@/lib/utils";
import type { PaymentQrCodeDto } from "@/types/payment";

/**
 * Scan-to-pay codes, large enough to scan off a screen.
 *
 * Shown contained on a white tile rather than through `Media`'s cover crop: a
 * QR with its quiet zone cut away, or one sitting on a dark card, is a picture
 * of a QR that no camera will read.
 */
export function PaymentQrList({
  codes,
  className,
}: {
  codes: PaymentQrCodeDto[];
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      {codes.map((code, index) => (
        <li key={`${index}-${code.imageUrl}`}>
          <PaymentQrTile code={code} />
        </li>
      ))}
    </ul>
  );
}

function PaymentQrTile({ code }: { code: PaymentQrCodeDto }) {
  const [copied, setCopied] = React.useState(false);
  const name = qrCodeName(code);
  const accountNumber = code.accountNumber;

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Account number copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("We couldn't copy that — select the number instead.");
    }
  };

  return (
    <figure className="flex h-full flex-col items-center gap-3 rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted p-4 text-center">
      <figcaption className="text-xs font-bold uppercase tracking-wide text-muted">{name}</figcaption>

      <a
        href={code.imageUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Open the code full size"
        className="block w-full max-w-56 rounded-xl bg-white p-2 shadow-card"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- uploads are served by the API host, which next/image would need whitelisted */}
        <img
          src={code.imageUrl}
          alt={`${name} QR code for ${code.accountTitle}`}
          className="aspect-square w-full object-contain"
        />
      </a>

      <div className="flex flex-col items-center gap-0.5">
        <span className="font-bold text-primary">{code.accountTitle}</span>
        {hasText(accountNumber) && (
          <button
            type="button"
            onClick={() => void copy(accountNumber)}
            aria-label={`Copy account number ${accountNumber}`}
            className="numeric inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-sm text-secondary transition-colors hover:bg-surface hover:text-brand"
          >
            {accountNumber}
            {copied ? (
              <Check aria-hidden className="size-3.5 text-success" />
            ) : (
              <Copy aria-hidden className="size-3.5" />
            )}
          </button>
        )}
      </div>
    </figure>
  );
}
