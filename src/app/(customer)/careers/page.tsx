import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Careers" };

export default function Page() {
  return (
    <div className="container-zass py-10">
      <PhasePlaceholder
        phase="Coming soon"
        title="Careers"
        description="Open roles at ZassDelivery."
      />
    </div>
  );
}
