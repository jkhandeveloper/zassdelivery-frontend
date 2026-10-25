import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "About ZassFood" };

export default function Page() {
  return (
    <div className="container-zass py-10">
      <PhasePlaceholder
        phase="Coming soon"
        title="About ZassFood"
        description="Who we are and where we deliver."
      />
    </div>
  );
}
