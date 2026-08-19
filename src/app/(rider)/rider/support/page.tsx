"use client";

import { SupportView } from "@/components/support/support-view";
import { TicketCategory } from "@/types/enums";

/**
 * Rider support.
 *
 * Lives inside the rider shell rather than linking to the customer `/support`
 * page — that route sits in the storefront layout, so sending a rider there put
 * them behind the customer navbar with a cart and a restaurant list.
 */
export default function RiderSupportPage() {
  return (
    <SupportView
      title="Support"
      description="Something wrong with a run, your earnings or your account? Open a ticket and we'll pick it up."
      categories={[
        TicketCategory.DELIVERY_ISSUE,
        TicketCategory.ORDER_ISSUE,
        TicketCategory.PAYMENT_ISSUE,
        TicketCategory.ACCOUNT,
        TicketCategory.OTHER,
      ]}
    />
  );
}
