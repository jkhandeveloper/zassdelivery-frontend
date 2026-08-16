import type { ReactNode } from "react";

import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * §5.13: a desktop split screen — a cinematic left panel and a clean form on
 * the right. No navbar: an auth screen with somewhere else to go is an auth
 * screen people leave.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="relative hidden w-[55%] flex-col justify-between overflow-hidden bg-zass-dark p-12 lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(230,57,70,0.45),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(255,107,53,0.4),transparent_50%)]"
        />

        <div className="relative">
          <Logo tone="inverse" />
        </div>

        <div className="relative flex max-w-lg flex-col gap-5">
          <h2 className="font-display text-5xl font-extrabold leading-[1.05] text-white">
            Your cravings,
            <br />
            <span className="text-gradient-brand">delivered.</span>
          </h2>
          <p className="text-lg leading-relaxed text-white/70">
            From the karahi down the road to the biryani you drive across town for — ordered in
            seconds, tracked to your door.
          </p>
        </div>

        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} ZassDelivery
        </p>
      </aside>

      <div className="flex w-full flex-col lg:w-[45%]">
        <header className="flex items-center justify-between p-6">
          <Logo className="lg:hidden" />
          <Link
            href="/"
            className="hidden text-sm font-semibold text-secondary transition-colors hover:text-brand lg:block"
          >
            ← Back to ZassDelivery
          </Link>
          <ThemeToggle />
        </header>

        <main id="main" className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
