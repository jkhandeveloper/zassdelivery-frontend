import { AccountNav } from "@/components/account/account-nav";
import { FavoritesView } from "@/components/account/favorites-view";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = { title: "Favourites" };

export default function Page() {
  return (
    <div className="container-zass py-8 lg:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Saved restaurants" }]} />

      <header className="mb-7 mt-4 flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">Saved restaurants</h1>
        <p className="text-secondary">The kitchens you keep coming back to.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[16rem_1fr]">
        <AccountNav className="lg:sticky lg:top-24" />
        <FavoritesView />
      </div>
    </div>
  );
}
