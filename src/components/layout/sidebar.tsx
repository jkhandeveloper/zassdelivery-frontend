"use client";

import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Optional count/dot — e.g. unread orders. Hidden while collapsed. */
  badge?: number | string;
}

export interface SidebarGroup {
  /** A small uppercase caption above the group; omit for an untitled block. */
  heading?: string;
  items: readonly SidebarItem[];
}

export type SidebarAccent = "brand" | "warm" | "gold";

/** Active-item treatment per portal accent, so the three portals stay distinct (§12). */
const ACCENTS: Record<
  SidebarAccent,
  { active: string; bar: string; badge: string }
> = {
  brand: {
    active: "bg-brand-soft text-brand",
    bar: "bg-brand",
    badge: "bg-brand text-brand-contrast",
  },
  warm: {
    active: "bg-accent-warm-soft text-accent-warm",
    bar: "bg-accent-warm",
    badge: "bg-accent-warm text-white",
  },
  gold: {
    active: "bg-accent-gold-soft text-accent-gold",
    bar: "bg-accent-gold",
    badge: "bg-accent-gold text-zass-dark",
  },
};

export interface SidebarProps {
  groups: readonly SidebarGroup[];
  /** Tints the active state so vendor/rider/admin never feel like one page (§12). */
  accent?: SidebarAccent;
  /** Brand/logo block pinned to the top. Given the collapsed state so it can adapt. */
  header?: (collapsed: boolean) => React.ReactNode;
  /** Footer block (user card, sign-out). Given the collapsed state so it can adapt. */
  footer?: (collapsed: boolean) => React.ReactNode;
  /** Start the desktop rail collapsed to icons. */
  defaultCollapsed?: boolean;
  /**
   * Controlled mobile-drawer state. When provided, the built-in floating
   * trigger is suppressed — the parent owns the open button (e.g. a header
   * menu). Omit for a self-managed sidebar that renders its own trigger.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name for the landmark. */
  label?: string;
  className?: string;
}

/**
 * A glassmorphism sidebar that reads through to the dark canvas behind it, and
 * collapses to an icon rail on desktop / slides away off-canvas on mobile.
 *
 * The glass is the same recipe the sticky headers already use (§ globals.css):
 * a translucent surface via `color-mix` over `backdrop-blur`, so the effect is
 * consistent across the app rather than a one-off. Width and the label reveal
 * are animated on `--ease-out-soft` — the house easing — so the collapse feels
 * of a piece with the modals and drawers.
 */
export function Sidebar({
  groups,
  accent = "brand",
  header,
  footer,
  defaultCollapsed = false,
  open,
  onOpenChange,
  label = "Sidebar",
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const tint = ACCENTS[accent];
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  // The mobile drawer is controlled when `open` is supplied, else self-managed.
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const mobileOpen = isControlled ? open : uncontrolledOpen;
  const setMobileOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  // While the off-canvas panel is open, lock the page behind it and let Escape
  // close it — the two things a hand-rolled overlay is expected to get right.
  React.useEffect(() => {
    if (!mobileOpen) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, setMobileOpen]);

  const nav = (
    <nav
      className="flex flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden px-3 py-4"
      aria-label={label}
    >
      {groups.map((group, index) => (
        <div key={group.heading ?? index} className="flex flex-col gap-1">
          {group.heading !== undefined && (
            // The caption would clip mid-word as the rail narrows, so it fades
            // out and collapses its height rather than getting sliced.
            <p
              className={cn(
                "overflow-hidden px-3 text-[0.6875rem] font-extrabold uppercase tracking-widest text-muted transition-all duration-200",
                collapsed ? "h-0 opacity-0" : "h-4 pb-1.5 opacity-100",
              )}
            >
              {group.heading}
            </p>
          )}

          {group.items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                // Tapping a destination closes the mobile drawer; a no-op on
                // desktop where the panel is a static column.
                onClick={() => setMobileOpen(false)}
                // The native tooltip is the label's stand-in once it's hidden.
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group/item relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors duration-200",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  collapsed && "justify-center",
                  active
                    ? tint.active
                    : "text-secondary hover:bg-surface-muted hover:text-primary",
                )}
              >
                {/* Active accent bar — anchored to the rail edge in both states. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full transition-opacity duration-200",
                    tint.bar,
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon className="size-[18px] shrink-0" />

                {/* Label + badge share one row that clips to zero width as the
                    rail collapses, giving a smooth reveal without reflow. */}
                <span
                  className={cn(
                    "flex min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap transition-all duration-200",
                    collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
                  )}
                >
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-bold tabular-nums",
                        active ? tint.badge : "bg-surface-sunken text-secondary",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Built-in mobile trigger — only when self-managed. A controlled parent
          (e.g. RoleShell's header) supplies its own button instead. */}
      {!isControlled && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          className="fixed left-4 top-4 z-40 grid size-11 place-items-center rounded-full border border-border-subtle bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] text-primary shadow-card backdrop-blur-xl transition-colors hover:bg-surface-muted lg:hidden"
        >
          <Menu className="size-5" />
        </button>
      )}

      {/* Mobile scrim. Fades with the panel; tap to dismiss. */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-[color-mix(in_srgb,var(--surface-inverse)_55%,transparent)] backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label={label}
        className={cn(
          // Off-canvas drawer < lg, static column ≥ lg.
          "fixed inset-y-0 left-0 z-50 flex h-dvh flex-col transition-[width,transform] duration-300 ease-[var(--ease-out-soft)]",
          "lg:sticky lg:top-0 lg:z-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // The glass: translucent surface + blur, a hairline edge, and a soft
          // top-to-bottom sheen so the panel has depth against the dark canvas.
          "border-r border-border-subtle bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] shadow-panel backdrop-blur-2xl",
          "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.06] before:to-transparent before:content-[''] dark:before:from-white/[0.04]",
          // Mobile is always full-label width; only desktop honours the rail.
          // Literal classes (not interpolated) so Tailwind actually emits them.
          "w-72",
          collapsed ? "lg:w-[4.75rem]" : "lg:w-64",
          className,
        )}
      >
        {/* Header row: brand slot + a close (mobile) / nothing here on desktop. */}
        <div
          className={cn(
            "relative flex h-20 shrink-0 items-center border-b border-border-subtle px-4",
            collapsed && "lg:justify-center lg:px-2",
          )}
        >
          <div className="min-w-0 flex-1">{header?.(collapsed)}</div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="grid size-9 shrink-0 place-items-center rounded-full text-secondary transition-colors hover:bg-surface-muted hover:text-primary lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        {nav}

        <div className="relative shrink-0 border-t border-border-subtle p-3">
          {footer !== undefined && <div className="mb-2">{footer(collapsed)}</div>}

          {/* Collapse toggle — desktop only; the mobile panel is never a rail. */}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            title={collapsed ? "Expand" : "Collapse"}
            className={cn(
              "hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-secondary transition-colors duration-200 hover:bg-surface-muted hover:text-primary lg:flex",
              collapsed && "justify-center",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-[18px] shrink-0" />
            ) : (
              <PanelLeftClose className="size-[18px] shrink-0" />
            )}
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-200",
                collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
              )}
            >
              Collapse
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
