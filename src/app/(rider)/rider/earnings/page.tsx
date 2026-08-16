import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Earnings" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Earnings"
      description="What you have earned today, this week and lifetime."
      endpoints={[
        "GET /riders/me/earnings",
        "GET /riders/me/earnings/summary",
      ]}
    />
  );
}
