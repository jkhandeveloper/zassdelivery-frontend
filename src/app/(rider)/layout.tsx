"use client";

import type { ReactNode } from "react";

import { Banknote, Bike, Inbox, LayoutDashboard, LifeBuoy, Wallet } from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { RoleShell, type RoleNavGroup } from "@/components/layout/role-shell";
import { UserRole } from "@/types/auth";

const RIDER_NAV: readonly RoleNavGroup[] = [
  {
    items: [
      { href: "/rider", label: "Today", icon: LayoutDashboard },
      { href: "/rider/offers", label: "Offers", icon: Inbox },
      { href: "/rider/deliveries", label: "Deliveries", icon: Bike },
    ],
  },
  {
    heading: "Money",
    items: [
      { href: "/rider/earnings", label: "Earnings", icon: Banknote },
      { href: "/rider/wallet", label: "Wallet", icon: Wallet },
      { href: "/rider/withdrawals", label: "Withdrawals", icon: Banknote },
    ],
  },
  {
    heading: "Help",
    // The rider's own support screen, not the customer one at /support — that
    // route lives in the customer shell, so sending a rider there dropped them
    // onto the storefront navbar and let them order food from the portal.
    items: [{ href: "/rider/support", label: "Support", icon: LifeBuoy }],
  },
];

/**
 * Riders reach this shell as soon as they register — approval gates what the
 * screens inside will *do*, not whether the portal exists, so an applicant can
 * still see their status and upload documents.
 */
export default function RiderLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute roles={[UserRole.RIDER]}>
      <RoleShell portal="Rider" accent="warm" groups={RIDER_NAV}>
        <div id="main">{children}</div>
      </RoleShell>
    </ProtectedRoute>
  );
}
