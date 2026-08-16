import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "About ZassDelivery" };

export default function Page() {
  return (
    <div className="container-zass py-10">
      <PhasePlaceholder
        phase="Coming soon"
        title="About ZassDelivery"
        description="Who we are and where we deliver."
      />
    </div>
  );
}
