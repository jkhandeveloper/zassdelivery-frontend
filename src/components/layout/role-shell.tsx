"use client";

import { LogOut, Menu, type LucideIcon } from "lucide-react";
import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

import { ConnectionIndicator } from "./connection-indicator";
import { Logo } from "./logo";
import { Sidebar, type SidebarAccent } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";

export interface RoleNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hidden unless the user holds every listed permission (§8). */
  permissions?: readonly string[];
}

export interface RoleNavGroup {
  heading?: string;
  items: readonly RoleNavItem[];
}

export interface RoleShellProps {
  /** Names the portal in the sidebar — "Vendor", "Rider", "Admin". */
  portal: string;
  /** A tint so the three portals never feel like the same page (§12). */
  accent: SidebarAccent;
  groups: readonly RoleNavGroup[];
  children: React.ReactNode;
}

const ACCENT_BADGE: Record<SidebarAccent, string> = {
  brand: "bg-brand-soft text-brand",
  warm: "bg-accent-warm-soft text-accent-warm",
  gold: "bg-accent-gold-soft text-accent-gold",
} as const;

/**
 * The shared chrome behind the vendor, rider and admin portals: the glass
 * {@link Sidebar} — a collapsible rail on desktop, an off-canvas drawer below
 * it — plus a slim top bar for account and connection status.
 *
 * One shell with a per-portal accent and nav, rather than three near-identical
 * layouts that drift the moment one of them gains a feature.
 */
export function RoleShell({ portal, accent, groups, children }: RoleShellProps) {
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const visibleGroups = React.useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              item.permissions === undefined ||
              item.permissions.every((code) => user?.permissions.includes(code) === true),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [groups, user],
  );

  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar
        accent={accent}
        groups={visibleGroups}
        label={`${portal} navigation`}
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        header={(collapsed) => (
          <div className={cn("flex items-center gap-2", collapsed && "lg:justify-center")}>
            <Logo showWordmark={false} />
            {!collapsed && (
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-display text-base font-extrabold">
                  ZassDelivery
                </span>
                <span
                  className={cn(
                    "w-fit rounded-full px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide",
                    ACCENT_BADGE[accent],
                  )}
                >
                  {portal}
                </span>
              </div>
            )}
          </div>
        )}
        footer={(collapsed) => (
          <button
            type="button"
            onClick={() => void logout()}
            title={collapsed ? "Sign out" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-danger-soft hover:text-danger",
              collapsed && "justify-center",
            )}
          >
            <LogOut className="size-[18px] shrink-0" />
            {!collapsed && "Sign out"}
          </button>
        )}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border-subtle bg-[color-mix(in_srgb,var(--canvas)_85%,transparent)] px-4 backdrop-blur-xl lg:px-8">
          {/* Mobile trigger — drives the sidebar's controlled drawer. */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            className="grid size-10 place-items-center rounded-full text-secondary transition-colors hover:bg-surface-muted hover:text-primary lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <span className="font-display text-lg font-extrabold lg:hidden">{portal}</span>

          <div className="ml-auto flex items-center gap-2">
            <ConnectionIndicator />
            <ThemeToggle />
            {user !== null && (
              <div className="hidden items-center gap-2.5 border-l border-border-subtle pl-3 sm:flex">
                <div className="text-right leading-tight">
                  <p className="max-w-40 truncate text-sm font-bold">{user.fullName}</p>
                  <p className="text-xs capitalize text-muted">
                    {user.role.toLowerCase().replace(/_/g, " ")}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="gradient-brand grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                >
                  {user.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part.charAt(0).toUpperCase())
                    .join("")}
                </span>
              </div>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
