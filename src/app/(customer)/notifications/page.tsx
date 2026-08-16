import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Notifications" };

export default function Page() {
  return (
    <div className="container-zass py-10">
      <PhasePlaceholder
        phase="Coming soon"
        title="Notifications"
        description="Order updates, promotions and account notices."
        endpoints={[
          "GET /notifications",
          "POST /notifications/read-all",
        ]}
      />
    </div>
  );
}
