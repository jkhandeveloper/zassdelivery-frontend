import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Audit log" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Audit log"
      description="What staff changed, and when."
      endpoints={[
        "GET /audit-logs",
        "GET /audit-logs/entity-types",
      ]}
    />
  );
}
