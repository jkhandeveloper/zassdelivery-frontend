import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Platform settings" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Platform settings"
      description="Fees, delivery rules and the values the platform runs on."
      endpoints={[
        "GET /settings",
        "PUT /settings",
      ]}
    />
  );
}
