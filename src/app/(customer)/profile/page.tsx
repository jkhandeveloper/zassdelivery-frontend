import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Your profile" };

export default function Page() {
  return (
    <div className="container-zass py-10">
      <PhasePlaceholder
        phase="Coming soon"
        title="Your profile"
        description="Your details, saved addresses and notification preferences."
        endpoints={[
          "GET /me",
          "PATCH /me",
          "GET /me/addresses",
        ]}
      />
    </div>
  );
}
