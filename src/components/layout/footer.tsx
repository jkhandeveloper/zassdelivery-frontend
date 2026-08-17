import Link from "next/link";

import { Logo } from "./logo";

const COLUMNS = [
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
      { href: "/support", label: "Help & support" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/refunds", label: "Refund policy" },
    ],
  },
  {
    heading: "Partner with us",
    links: [
      { href: "/vendor", label: "Restaurant login" },
      { href: "/vendor/onboarding", label: "Add your restaurant" },
      { href: "/rider", label: "Rider login" },
      { href: "/rider/onboarding", label: "Ride with Zass" },
    ],
  },
] as const;

/** §2: dark, premium. The last thing on every customer page. */
export function Footer() {
  return (
    <footer className="mt-auto bg-zass-dark text-[#9cb5c8]">
      <div className="container-zass py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-4">
            <Logo tone="inverse" />
            <p className="max-w-xs text-[0.9375rem] leading-relaxed">
              Food from the places you already love, brought to your door across Pakistan.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading} className="flex flex-col gap-4">
              <h3 className="font-display text-sm font-extrabold uppercase tracking-widest text-white">
                {column.heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.9375rem] transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            © {new Date().getFullYear()} ZassDelivery. All rights reserved.
          </p>
          <p className="text-sm">Made for Pakistan</p>
        </div>
      </div>
    </footer>
  );
}
