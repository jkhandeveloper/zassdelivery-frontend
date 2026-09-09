import { AccountNav } from "@/components/account/account-nav";
import { NotificationsView } from "@/components/account/notifications-view";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = { title: "Notifications" };

export default function Page() {
  return (
    <div className="container-zass py-8 lg:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Notifications" }]} />

      <header className="mb-7 mt-4 flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">Notifications</h1>
        <p className="text-secondary">Order updates, offers and account notices.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[16rem_1fr]">
        <AccountNav className="lg:sticky lg:top-24" />
        <NotificationsView />
      </div>
    </div>
  );
}
