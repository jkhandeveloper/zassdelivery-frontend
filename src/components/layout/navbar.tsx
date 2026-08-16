"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, ChevronDown, LogOut, MapPin, Menu, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { homeRouteForRole, UserRole } from "@/types/auth";

import { ConnectionIndicator } from "./connection-indicator";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { href: "/restaurants", label: "Restaurants" },
  { href: "/offers", label: "Offers" },
  { href: "/orders", label: "Orders" },
  { href: "/favorites", label: "Favorites" },
] as const;

/**
 * The customer navbar (§5.1).
 *
 * Search, location and the cart/notification counts are wired to their
 * endpoints in later phases — the shell stands them up with real affordances
 * rather than fake numbers, so nothing here displays a value the API has not
 * actually returned.
 */
export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isReady, logout } = useAuth();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border-subtle bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className={cn("container-zass flex items-center gap-4 transition-all duration-300", scrolled ? "h-16" : "h-20")}>
        <Logo className="shrink-0" />

        {/* Location — drives the city/zone filters on the listing endpoints. */}
        <button
          type="button"
          className="hidden shrink-0 items-center gap-2 rounded-full border border-border-default bg-surface px-3.5 py-2 text-sm font-medium text-secondary transition-colors hover:border-brand hover:text-brand lg:inline-flex"
        >
          <MapPin className="size-4 text-brand" />
          <span className="max-w-32 truncate">Set your location</span>
          <ChevronDown className="size-3.5" />
        </button>

        {/* Search — GET /search/autocomplete, debounced (§5.6). */}
        <div className="relative hidden min-w-0 flex-1 md:block">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Search restaurants or dishes…"
            aria-label="Search restaurants or dishes"
            className="h-11 w-full rounded-full border border-border-default bg-surface pl-11 pr-4 text-[0.9375rem] text-primary placeholder:text-muted transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-[var(--brand-ring)]"
          />
        </div>

        <nav className="hidden shrink-0 items-center gap-1 xl:flex" aria-label="Main">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                  active ? "bg-brand-soft text-brand" : "text-secondary hover:text-primary",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ConnectionIndicator className="hidden lg:inline-flex" />
          <ThemeToggle className="hidden lg:inline-flex" />

          {isAuthenticated && (
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative grid size-10 place-items-center rounded-full text-secondary transition-colors hover:bg-surface-muted hover:text-primary"
            >
              <Bell className="size-5" />
            </Link>
          )}

          <Link
            href="/cart"
            aria-label="Cart"
            className="relative grid size-10 place-items-center rounded-full text-secondary transition-colors hover:bg-surface-muted hover:text-primary"
          >
            <ShoppingBag className="size-5" />
          </Link>

          {!isReady ? (
            <div aria-hidden className="skeleton-sheen size-10 rounded-full bg-[var(--skeleton-base)]" />
          ) : isAuthenticated && user !== null ? (
            <UserMenu
              name={user.fullName}
              role={user.role}
              dashboardHref={homeRouteForRole(user)}
              onLogout={() => void logout()}
            />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}

          <MobileNav pathname={pathname} showAuthLinks={isReady && !isAuthenticated} />
        </div>
      </div>
    </header>
  );
}

function UserMenu({
  name,
  role,
  dashboardHref,
  onLogout,
}: {
  name: string;
  role: UserRole;
  dashboardHref: string;
  onLogout: () => void;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const item =
    "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-secondary outline-none transition-colors data-[highlighted]:bg-surface-muted data-[highlighted]:text-primary";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Account menu"
        className="gradient-brand grid size-10 place-items-center rounded-full text-sm font-bold text-white transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:hover:scale-100"
      >
        {initials === "" ? <User className="size-5" /> : initials}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={10}
          align="end"
          className="z-50 min-w-56 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-1.5 shadow-panel data-[state=open]:animate-[zass-fade-in_150ms_ease-out]"
        >
          <div className="border-b border-border-subtle px-3 pb-2.5 pt-2">
            <p className="truncate text-sm font-bold text-primary">{name}</p>
            <p className="text-xs capitalize text-muted">
              {role.toLowerCase().replace(/_/g, " ")}
            </p>
          </div>

          <div className="pt-1.5">
            {role !== UserRole.CUSTOMER && (
              <DropdownMenu.Item asChild className={item}>
                <Link href={dashboardHref}>Dashboard</Link>
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Item asChild className={item}>
              <Link href="/profile">Profile</Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild className={item}>
              <Link href="/orders">My orders</Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild className={item}>
              <Link href="/support">Support</Link>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="my-1.5 h-px bg-border-subtle" />

            <DropdownMenu.Item
              onSelect={onLogout}
              className={cn(item, "text-danger data-[highlighted]:text-danger")}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MobileNav({
  pathname,
  showAuthLinks,
}: {
  pathname: string;
  showAuthLinks: boolean;
}) {
  return (
    <Drawer>
      <DrawerTrigger
        aria-label="Open menu"
        className="grid size-10 place-items-center rounded-full text-secondary transition-colors hover:bg-surface-muted hover:text-primary xl:hidden"
      >
        <Menu className="size-5" />
      </DrawerTrigger>

      <DrawerContent title="Menu" width="sm">
        <nav className="flex flex-col gap-1 p-4" aria-label="Mobile">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-xl px-4 py-3 font-semibold transition-colors",
                  active ? "bg-brand-soft text-brand" : "text-secondary hover:bg-surface-muted",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Below 640px the header's sign-in buttons are hidden, so without
            these a signed-out visitor has no way in from the nav at all. */}
        {showAuthLinks && (
          <div className="flex flex-col gap-2 border-t border-border-subtle p-4">
            <Button variant="primary" block asChild>
              <Link href="/register">Create an account</Link>
            </Button>
            <Button variant="outline" block asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        )}

        <div className="border-t border-border-subtle p-4">
          <ThemeToggle />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
