"use client";

import type { ReactNode } from "react";

import {
  BarChart3,
  Bike,
  CreditCard,
  Image as ImageIcon,
  LayoutDashboard,
  LifeBuoy,
  Radio,
  ScrollText,
  Settings,
  Store,
  Ticket,
  UsersRound,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { RoleShell, type RoleNavGroup } from "@/components/layout/role-shell";
import { UserRole } from "@/types/auth";

/**
 * Nav items carry the permission codes their pages need. §8: gate on the
 * caller's actual permissions from /auth/me, not on role alone — an ADMIN and
 * a SUPER_ADMIN do not necessarily hold the same set.
 */
const ADMIN_NAV: readonly RoleNavGroup[] = [
  {
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    heading: "Operations",
    items: [
      { href: "/admin/dispatch", label: "Dispatch", icon: Radio },
      { href: "/admin/restaurants", label: "Restaurants", icon: Store },
      { href: "/admin/riders", label: "Riders", icon: Bike },
      { href: "/admin/users", label: "Users", icon: UsersRound },
    ],
  },
  {
    heading: "Commerce",
    items: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket },
      { href: "/admin/banners", label: "Banners", icon: ImageIcon },
    ],
  },
  {
    heading: "Platform",
    items: [
      { href: "/admin/support", label: "Support", icon: LifeBuoy },
      { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute roles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <RoleShell portal="Admin" accent="gold" groups={ADMIN_NAV}>
        <div id="main">{children}</div>
      </RoleShell>
    </ProtectedRoute>
  );
}
