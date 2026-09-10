"use client";

import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { PaymentQrEditor } from "@/components/payments/payment-qr-editor";
import { useAuth } from "@/components/providers/auth-provider";
import { VendorGate } from "@/components/vendor/vendor-gate";
import { useSetRestaurantQrCodes } from "@/hooks/use-vendor";
import { ApiError } from "@/lib/api-client";
import { MAX_PAYMENT_QR_CODES } from "@/lib/payment-labels";
import { UserRole } from "@/types/auth";
import type { RestaurantAdminDto } from "@/types/restaurant";

export default function VendorPaymentsPage() {
  return (
    <VendorGate allowUnapproved>
      {(restaurant) => <PaymentQrSettings restaurant={restaurant} />}
    </VendorGate>
  );
}

function PaymentQrSettings({ restaurant }: { restaurant: RestaurantAdminDto }) {
  const { user } = useAuth();
  const save = useSetRestaurantQrCodes(restaurant.id);

  // Staff can read the list, but only the owner may change where money goes —
  // the API enforces it, and the form says so up front rather than on Save.
  const isOwner = user?.role === UserRole.VENDOR_OWNER;

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Scan-to-pay QR codes"
        description="Customers who choose Scan & pay at checkout see these on their order and pay you directly — no gateway, no fees."
      />

      {!isOwner && (
        <p className="flex items-start gap-2 rounded-[var(--radius-input)] bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
          <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          Only the owner can change where payments go. You can still confirm payments from the
          order queue.
        </p>
      )}

      <Panel
        title="Your codes"
        description={`Up to ${MAX_PAYMENT_QR_CODES} — JazzCash, Easypaisa, a bank or a Raast QR. Removing them all turns Scan & pay off at checkout.`}
      >
        <PaymentQrEditor
          codes={restaurant.paymentQrCodes}
          defaultAccountTitle={restaurant.name}
          disabled={!isOwner}
          saving={save.isPending}
          onSave={(codes) =>
            save.mutate(
              { codes },
              {
                onSuccess: () => toast.success("QR codes saved"),
                onError: (error) =>
                  toast.error(
                    error instanceof ApiError ? error.message : "We couldn't save your QR codes.",
                  ),
              },
            )
          }
        />
      </Panel>

      <Panel title="How it works">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-secondary">
          <li>
            A customer picks <strong className="text-primary">Scan &amp; pay</strong> at checkout.
            It&apos;s only offered once you&apos;ve saved at least one code.
          </li>
          <li>
            Their order page shows these codes with the amount and the order number to quote.
          </li>
          <li>
            When the money lands in your app, press{" "}
            <strong className="text-primary">Payment received</strong> on the ticket in your order
            queue. Add the TID if you have it — the same TID can&apos;t confirm two orders.
          </li>
        </ol>
      </Panel>
    </div>
  );
}
