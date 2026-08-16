import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "List your restaurant" };

export default function Page() {
  return (
    <div className="container-zass py-10">
      <PhasePlaceholder
        phase="Coming soon"
        title="List your restaurant"
        description="Register your kitchen on ZassDelivery and start taking orders."
        endpoints={[
          "POST /restaurant-management",
        ]}
      />
    </div>
  );
}
