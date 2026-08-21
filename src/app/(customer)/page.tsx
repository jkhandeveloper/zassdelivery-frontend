import { BusinessTypeStrip } from "@/components/home/business-type-strip";
import { CategoryStrip } from "@/components/home/category-strip";
import { Hero } from "@/components/home/hero";
import { OfferBanner } from "@/components/home/offer-banner";
import { PopularRail } from "@/components/home/popular-rail";
import { PromoBand } from "@/components/home/promo-band";
import { RestaurantRail } from "@/components/home/restaurant-rail";
import { SectionHeader } from "@/components/ui/section-header";

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

        <section className="flex flex-col gap-5">
          <SectionHeader
            title="Order from anywhere"
            description="Restaurants, bakeries, cafes, cafeterias and shops — all delivering near you."
            viewAllHref="/restaurants"
          />
          <BusinessTypeStrip />
        </section>

        <PromoBand />

        <RestaurantRail
          title="Top rated near you"
          description="The highest-rated places delivering right now."
          query={{ limit: 8, sortBy: "rating", sortOrder: "desc", acceptingOnly: true }}
        />

        <PopularRail
          title="Popular near you"
          description="The dishes people are ordering most this week."
        />

        <OfferBanner />

        <RestaurantRail
          title="New on ZassDelivery"
          description="Places that just joined."
          query={{ limit: 8, sortBy: "createdAt", sortOrder: "desc" }}
          emptyTitle="Nothing new this week"
          emptyDescription="Newly approved places show up here as they join."
        />
      </div>
    </>
  );
}
