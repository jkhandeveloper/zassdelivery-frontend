import { RestaurantDetail } from "@/components/restaurant/restaurant-detail";

export async function generateMetadata(props: PageProps<"/restaurants/[slug]">) {
  const { slug } = await props.params;
  // The name is not known without a fetch; the slug is a reasonable stand-in
  // and avoids blocking render on a request the client makes anyway.
  const readable = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: readable,
    description: `Order from ${readable} on ZassDelivery.`,
  };
}

export default async function RestaurantPage(props: PageProps<"/restaurants/[slug]">) {
  const { slug } = await props.params;

  return (
    <div className="container-zass py-8">
      <RestaurantDetail slug={slug} />
    </div>
  );
}
