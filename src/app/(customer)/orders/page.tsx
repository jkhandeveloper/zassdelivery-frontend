import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Your orders" };

export default function Page() {
  return (
    <div className="container-zass py-10">
      <PhasePlaceholder
        phase="Coming soon"
        title="Your orders"
        description="Every order you have placed, with the live ones first."
        endpoints={[
          "GET /orders",
        ]}
      />
    </div>
  );
}
