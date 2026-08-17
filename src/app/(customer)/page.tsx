import { CategoryStrip } from "@/components/home/category-strip";
import { Hero } from "@/components/home/hero";
import { OfferBanner } from "@/components/home/offer-banner";
import { PopularRail } from "@/components/home/popular-rail";
import { PromoBand } from "@/components/home/promo-band";
import { RestaurantRail } from "@/components/home/restaurant-rail";

/**
 * The storefront.
 *
 * Every section below the hero is fed by a real endpoint — categories,
 * restaurants, popular dishes, the signed-in customer's own coupons — and each
 * one hides itself rather than inventing content when its source is empty.
 */
export default function HomePage() {
  return (
    <>
      <Hero />

      <div className="container-zass flex flex-col gap-16 py-14 lg:gap-20 lg:py-20">
        <CategoryStrip />

        <PromoBand />

        <RestaurantRail
          title="Top restaurants"
          description="The highest-rated kitchens delivering right now."
          query={{ limit: 8, sortBy: "rating", sortOrder: "desc", acceptingOnly: true }}
        />

        <PopularRail
          title="Popular near you"
          description="The dishes people are ordering most this week."
        />

        <OfferBanner />

        <RestaurantRail
          title="New on ZassDelivery"
          description="Kitchens that just joined."
          query={{ limit: 8, sortBy: "createdAt", sortOrder: "desc" }}
          emptyTitle="No new kitchens this week"
          emptyDescription="Newly approved restaurants show up here as they join."
        />
      </div>
    </>
  );
}
