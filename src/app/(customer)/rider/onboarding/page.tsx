import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Deliver with ZassDelivery" };

export default function Page() {
  return (
    <div className="container-zass py-10">
      <PhasePlaceholder
        phase="Coming soon"
        title="Deliver with ZassDelivery"
        description="Sign up to deliver, upload your documents and get approved."
        endpoints={[
          "POST /riders/register",
          "PUT /riders/me/documents",
        ]}
      />
    </div>
  );
}
