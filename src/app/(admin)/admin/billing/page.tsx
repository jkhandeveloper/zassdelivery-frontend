import { Suspense } from "react";

import { AdminBillingView } from "@/components/admin/billing-view";

export const metadata = { title: "Vendor billing" };

export default function Page() {
  return (
    <Suspense>
      <AdminBillingView />
    </Suspense>
  );
}
