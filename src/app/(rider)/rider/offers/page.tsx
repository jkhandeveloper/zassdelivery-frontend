import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Delivery offers" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Delivery offers"
      description="Runs offered to you, and the window you have to accept them."
      endpoints={[
        "GET /riders/me/offers?liveOnly=true",
        "POST /riders/me/offers/:id/accept",
      ]}
    />
  );
}
