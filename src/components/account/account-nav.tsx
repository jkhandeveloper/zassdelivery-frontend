"use client";

import {
  Bell,
  Heart,
  LifeBuoy,
  LogOut,
  MapPin,
  Package,
  Ticket,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const LINKS: readonly { href: string; label: string; icon: ReactNode }[] = [
  { href: "/profile", label: "Profile information", icon: <UserRound className="size-4" /> },
  { href: "/orders", label: "My orders", icon: <Package className="size-4" /> },
  { href: "/profile#addresses", label: "Addresses", icon: <MapPin className="size-4" /> },
  { href: "/favorites", label: "Saved restaurants", icon: <Heart className="size-4" /> },
  { href: "/offers", label: "Offers", icon: <Ticket className="size-4" /> },
  { href: "/notifications", label: "Notifications", icon: <Bell className="size-4" /> },
  { href: "/support", label: "Help & support", icon: <LifeBuoy className="size-4" /> },
];

/** The account rail from §5.7 — one nav shared by every screen behind sign-in. */
export function AccountNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <nav
      aria-label="Account"
      className={cn(
        "flex flex-col gap-1 rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-3 shadow-card",
        className,
      )}
    >
      {LINKS.map((link) => {
        // A "#addresses" link lives on the profile page; marking it active as
        // well would light up two rows for one screen.
        const active = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-brand-soft text-brand"
                : "text-secondary hover:bg-surface-muted hover:text-primary",
            )}
          >
            {link.icon}
            {link.label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => void logout()}
        className="mt-1 flex items-center gap-3 rounded-xl border-t border-border-subtle px-3.5 py-2.5 pt-3.5 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft"
      >
        <LogOut className="size-4" />
        Sign out
      </button>
    </nav>
  );
}
