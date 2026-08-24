import { Suspense } from "react";

import { AdminRidersView } from "@/components/admin/riders-view";

export const metadata = { title: "Riders" };

export default function Page() {
  // Reads `?status=` so the dashboard can link straight to the approval queue.
  return (
    <Suspense>
      <AdminRidersView />
    </Suspense>
  );
}
