import { AccountNav } from "@/components/account/account-nav";
import { ProfilePanel } from "@/components/account/profile-panel";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = { title: "Your profile" };

export default function Page() {
  return (
    <div className="container-zass py-8 lg:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My profile" }]} />

      <header className="mb-7 mt-4 flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">My profile</h1>
        <p className="text-secondary">Your details, saved addresses and where you order to.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[16rem_1fr]">
        <AccountNav className="lg:sticky lg:top-24" />
        <ProfilePanel />
      </div>
    </div>
  );
}
