"use client";

import { toast } from "sonner";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { PaymentQrEditor } from "@/components/payments/payment-qr-editor";
import { RiderGate } from "@/components/rider/rider-gate";
import { useSetRiderQrCodes } from "@/hooks/use-riders";
import { ApiError } from "@/lib/api-client";
import { MAX_PAYMENT_QR_CODES } from "@/lib/payment-labels";
import type { RiderDto } from "@/types/rider";

export default function RiderPaymentQrPage() {
  return <RiderGate>{(rider) => <PaymentQrSettings rider={rider} />}</RiderGate>;
}

function PaymentQrSettings({ rider }: { rider: RiderDto }) {
  const save = useSetRiderQrCodes();

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Payment QR"
        description="Customers paying at the door can scan these instead of handing over cash. Confirm each transfer from the delivery screen once it lands — until you do, the order still counts as unpaid."
      />

      <Panel
        title="Your codes"
        description={`Up to ${MAX_PAYMENT_QR_CODES}. Show them from the delivery screen with "Show my QR".`}
      >
        <PaymentQrEditor
          codes={rider.paymentQrCodes ?? []}
          defaultAccountTitle={rider.fullName}
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
    </div>
  );
}
