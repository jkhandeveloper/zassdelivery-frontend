import { AccountNav } from "@/components/account/account-nav";
import { SupportView } from "@/components/support/support-view";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { TicketCategory } from "@/types/enums";

export const metadata = { title: "Help & support" };

export default function Page() {
  return (
    <div className="container-zass py-8 lg:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Help & support" }]} />

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[16rem_1fr]">
        <AccountNav className="lg:sticky lg:top-24" />

        {/* The same component the rider and vendor portals use — the API scopes
            `GET /support-tickets` to the caller, so the screens differ only in
            the shell around them. */}
        <SupportView
          title="Help & support"
          description="Raise a ticket about an order and follow the conversation. We answer in the order they arrive."
          categories={[
            TicketCategory.ORDER_ISSUE,
            TicketCategory.DELIVERY_ISSUE,
            TicketCategory.PAYMENT_ISSUE,
            TicketCategory.RESTAURANT_COMPLAINT,
            TicketCategory.ACCOUNT,
            TicketCategory.OTHER,
          ]}
        />
      </div>
    </div>
  );
}
