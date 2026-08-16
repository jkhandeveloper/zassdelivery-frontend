import { OfferList } from "@/components/offers/offer-list";

export const metadata = {
  title: "Offers",
  description: "Coupons and deals you can use on your next ZassDelivery order.",
};

export default function OffersPage() {
  return (
    <div className="container-zass py-10">
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">Offers</h1>
        <p className="text-secondary">
          Copy a code, then apply it in your cart before checking out.
        </p>
      </header>

      <OfferList />
    </div>
  );
}
