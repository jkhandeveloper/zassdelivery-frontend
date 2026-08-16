import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Banners" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Banners"
      description="Promotional banners and where they appear."
      endpoints={[
        "GET /banner-management",
        "POST /banner-management",
        "PUT /banner-management/order",
      ]}
    />
  );
}
