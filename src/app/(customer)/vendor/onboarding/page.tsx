import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "List your restaurant" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="List your restaurant"
      description="Register your kitchen on ZassDelivery and start taking orders."
      endpoints={[
        "POST /restaurant-management",
      ]}
    />
  );
}
