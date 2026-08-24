import { Suspense } from "react";

import { AdminPaymentsView } from "@/components/admin/payments-view";

export const metadata = { title: "Payments" };

export default function Page() {
  // Reads `?tab=` so the dashboard can link straight to payouts or callbacks.
  return (
    <Suspense>
      <AdminPaymentsView />
    </Suspense>
  );
}
