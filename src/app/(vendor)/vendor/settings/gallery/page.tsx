import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Gallery" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Gallery"
      description="Photos customers see on your listing."
      endpoints={[
        "GET /restaurants/:id/images",
        "POST /restaurant-management/:id/images",
      ]}
    />
  );
}
