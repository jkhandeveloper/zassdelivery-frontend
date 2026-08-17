"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Bell,
  ChevronDown,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  User,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useCart } from "@/hooks/use-cart";
import { useAutocomplete } from "@/hooks/use-search";
import { useAddresses } from "@/hooks/use-users";
import { isFilledCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { homeRouteForRole, UserRole } from "@/types/auth";

import { ConnectionIndicator } from "./connection-indicator";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/offers", label: "Offers" },
  { href: "/orders", label: "Track order" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The customer navbar (§5.1): identity, where you are ordering to, one search
 * box, and the two counts that change while you shop.
 *
 * Counts come from the cart itself rather than a local store, so the badge can
 * never disagree with what checkout will charge for.
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

  const cart = useCart(isReady && isAuthenticated);
  const cartCount = isFilledCart(cart.data) ? cart.data.totals.totalQuantity : 0;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? // A cyan hairline under the glass, so the bar separates from the
            // canvas by light rather than by a heavier opaque border.
            "border-b border-brand/25 bg-[color-mix(in_srgb,var(--canvas)_78%,transparent)] shadow-[0_1px_0_0_var(--brand-ring)] backdrop-blur-xl"
          : "border-b border-border-subtle bg-surface",
      )}
    >
      <div
        className={cn(
          "container-zass flex items-center gap-3 transition-all duration-300 xl:gap-5",
          scrolled ? "h-16" : "h-[4.5rem]",
        )}
      >
        <Logo className="shrink-0" />

        <nav className="hidden shrink-0 items-center gap-0.5 xl:flex" aria-label="Main">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative px-2.5 py-2 text-sm font-semibold transition-colors",
                  active ? "text-brand" : "text-secondary hover:text-primary",
                  // The active tab is underlined the way the reference marks it,
                  // rather than filled — a filled pill fights the CTA colour.
                  "after:absolute after:inset-x-2.5 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-brand after:transition-transform after:duration-200 after:content-['']",
                  active ? "after:scale-x-100" : "after:scale-x-0",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <HeaderSearch className="ml-auto hidden min-w-56 max-w-md flex-1 md:block" />

        <DeliverToButton enabled={isReady && isAuthenticated} />

        <div className="flex shrink-0 items-center gap-1.5">
          <ConnectionIndicator className="hidden 2xl:inline-flex" />
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
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
            className="relative grid size-10 place-items-center rounded-full text-secondary transition-colors hover:bg-surface-muted hover:text-primary"
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 && (
              <span className="numeric absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-accent-warm px-1 text-[0.6875rem] font-extrabold text-white dark:text-[#2a1204]">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
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

/** Where the order is going. Reads the customer's default saved address. */
function DeliverToButton({ enabled }: { enabled: boolean }) {
  const addresses = useAddresses({ limit: 20 }, enabled);
  const items = addresses.data?.items ?? [];
  const preferred = items.find((address) => address.isDefault) ?? items[0];

  return (
    <Link
      href={enabled ? "/profile#addresses" : "/login?next=%2Fprofile"}
      className="hidden shrink-0 items-center gap-2 rounded-full border border-border-default bg-surface px-3.5 py-2 text-sm transition-colors hover:border-brand hover:text-brand 2xl:inline-flex"
    >
      <MapPin className="size-4 shrink-0 text-brand" />
      <span className="flex flex-col leading-tight">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
          Deliver to
        </span>
        <span className="max-w-36 truncate font-semibold text-primary">
          {preferred === undefined ? "Set your location" : preferred.line1}
        </span>
      </span>
      <ChevronDown className="size-3.5 shrink-0 text-muted" />
    </Link>
  );
}

/**
 * Search with suggestions from GET /search/autocomplete.
 *
 * The term is debounced here rather than in the hook so the box stays fully
 * responsive while the network settles behind it.
 */
function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [term, setTerm] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(timer);
  }, [term]);

  // Clicking anywhere else closes the panel; Escape does the same from the box.
  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const { data } = useAutocomplete(debounced);
  const hits = data ?? [];

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = term.trim();
    go(query === "" ? "/restaurants" : `/restaurants?q=${encodeURIComponent(query)}`);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={submit} role="search">
        <label htmlFor="header-search" className="sr-only">
          Search restaurants or dishes
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
        <input
          id="header-search"
          type="search"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder="Search food…"
          className="h-11 w-full rounded-full border border-border-default bg-surface-muted pl-11 pr-4 text-[0.9375rem] text-primary placeholder:text-muted transition-all focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-[var(--brand-ring)]"
        />
      </form>

      {open && hits.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-[var(--radius-card)] border border-border-subtle bg-surface p-1.5 shadow-panel">
          {hits.map((hit) => (
            <li key={`${hit.type}-${hit.id}`}>
              <button
                type="button"
                onClick={() =>
                  go(
                    // A dish hit carries its restaurant's slug, so both land on
                    // the storefront page; a category filters the listing.
                    hit.type === "category"
                      ? `/restaurants?category=${encodeURIComponent(hit.slug)}`
                      : `/restaurants/${hit.slug}`,
                  )
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-muted"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  {hit.type === "restaurant" ? (
                    <UtensilsCrossed className="size-4" />
                  ) : (
                    <Search className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-primary">
                  {hit.label}
                </span>
                <span className="shrink-0 text-xs capitalize text-muted">{hit.type}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
        className="flex items-center gap-1.5 rounded-full pl-0.5 pr-1.5 text-secondary transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span
          aria-hidden
          className="gradient-brand grid size-10 place-items-center rounded-full text-sm font-bold text-white transition-transform hover:scale-105 motion-reduce:hover:scale-100 dark:text-[#04202b]"
        >
          {initials === "" ? <User className="size-5" /> : initials}
        </span>
        <ChevronDown className="hidden size-3.5 sm:block" />
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
              <Link href="/favorites">Saved restaurants</Link>
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
        <div className="border-b border-border-subtle p-4 md:hidden">
          <HeaderSearch />
        </div>

        <nav className="flex flex-col gap-1 p-4" aria-label="Mobile">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);

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
          <Link
            href="/favorites"
            className="rounded-xl px-4 py-3 font-semibold text-secondary transition-colors hover:bg-surface-muted"
          >
            Favourites
          </Link>
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
