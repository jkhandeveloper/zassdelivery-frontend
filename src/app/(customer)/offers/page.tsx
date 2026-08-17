import { OfferList } from "@/components/offers/offer-list";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = {
  title: "Offers",
  description: "Coupons and deals you can use on your next ZassDelivery order.",
};

export default function OffersPage() {
  return (
    <div className="container-zass py-8 lg:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Offers" }]} />

      <header className="mb-7 mt-4 flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">Offers</h1>
        <p className="text-secondary">
          Copy a code, then apply it in your cart before checking out.
        </p>
      </header>

      <OfferList />
    </div>
  );
}
