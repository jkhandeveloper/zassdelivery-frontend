"use client";

import { SupportView } from "@/components/support/support-view";
import { TicketCategory } from "@/types/enums";

/**
 * Vendor support.
 *
 * Lives inside the vendor shell rather than linking to the customer `/support`
 * page — that route sits in the storefront layout, so sending a vendor there
 * put them behind the customer navbar with a cart and a restaurant list.
 */
export default function VendorSupportPage() {
  return (
    <SupportView
      title="Support"
      description="Problems with an order, a payout or your listing? Open a ticket and we'll pick it up."
      categories={[
        TicketCategory.ORDER_ISSUE,
        TicketCategory.PAYMENT_ISSUE,
        TicketCategory.DELIVERY_ISSUE,
        TicketCategory.ACCOUNT,
        TicketCategory.OTHER,
      ]}
    />
  );
}
