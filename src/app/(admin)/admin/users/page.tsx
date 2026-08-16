import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Users" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Users"
      description="Every account, with role and status changes."
      endpoints={[
        "GET /users",
        "POST /users",
        "PATCH /users/:id/status",
      ]}
    />
  );
}
