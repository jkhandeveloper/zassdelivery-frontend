import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Riders" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Riders"
      description="Rider approvals, document verification and suspensions."
      endpoints={[
        "GET /rider-management/riders",
        "POST /rider-management/riders/:id/approve",
        "POST /rider-management/documents/:id/verify",
      ]}
    />
  );
}
