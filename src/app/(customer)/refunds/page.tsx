import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Refund policy" };

export default function Page() {
  return (
    <div className="container-zass py-10">
      <PhasePlaceholder
        phase="Coming soon"
        title="Refund policy"
        description="When refunds apply and how long they take."
      />
    </div>
  );
}
