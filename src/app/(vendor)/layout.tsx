"use client";

import type { ReactNode } from "react";

import {
  ClipboardList,
  Clock,
  Images,
  LayoutDashboard,
  LifeBuoy,
  Store,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { RoleShell, type RoleNavGroup } from "@/components/layout/role-shell";
import { UserRole } from "@/types/auth";

const VENDOR_NAV: readonly RoleNavGroup[] = [
  {
    items: [
      { href: "/vendor", label: "Dashboard", icon: LayoutDashboard },
      { href: "/vendor/orders", label: "Order queue", icon: ClipboardList },
      { href: "/vendor/menu", label: "Menu", icon: UtensilsCrossed },
    ],
  },
  {
    heading: "Restaurant",
    items: [
      { href: "/vendor/settings/profile", label: "Profile", icon: Store },
      { href: "/vendor/settings/hours", label: "Opening hours", icon: Clock },
      { href: "/vendor/settings/gallery", label: "Gallery", icon: Images },
      { href: "/vendor/staff", label: "Staff", icon: UsersRound },
    ],
  },
  {
    heading: "Help",
    items: [{ href: "/support", label: "Support", icon: LifeBuoy }],
  },
];

/** Owners and their kitchen staff. Staff are scoped to one restaurant by the API. */
export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute roles={[UserRole.VENDOR_OWNER, UserRole.VENDOR_STAFF]}>
      <RoleShell portal="Vendor" accent="brand" groups={VENDOR_NAV}>
        <div id="main">{children}</div>
      </RoleShell>
    </ProtectedRoute>
  );
}
