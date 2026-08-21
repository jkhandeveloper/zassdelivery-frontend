"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";

/**
 * The wide band between the rails.
 *
 * It advertises the offers page rather than a specific discount — which coupon
 * a given customer can actually use is decided by the API, and a headline that
 * promises one they do not have is worse than no headline.
 */
export function OfferBanner() {
  const { isAuthenticated, isReady } = useAuth();
  const signedIn = isReady && isAuthenticated;

  return (
    <section className="gradient-warm relative isolate overflow-hidden rounded-[var(--radius-panel)] shadow-panel">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(30rem_20rem_at_85%_120%,rgb(255_255_255/0.25),transparent_60%)]"
      />

      <div className="flex flex-col items-start gap-6 p-8 text-white sm:p-12 lg:flex-row lg:items-center lg:justify-between dark:text-[#2a1204]">
        <div className="flex max-w-xl flex-col gap-3">
          <span className="w-fit rounded-full bg-white/25 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em]">
            Offers
          </span>
          <h2 className="text-3xl leading-tight sm:text-4xl">
            {signedIn ? "Your coupons are waiting" : "Sign up and start saving"}
          </h2>
          <p className="text-[1.0625rem] leading-relaxed opacity-90">
            {signedIn
              ? "Every code live on your account right now — copy one, then apply it in your cart before you check out."
              : "Create an account to see the coupons available to you, save your favourite kitchens and track every order live."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            asChild
            className="bg-surface text-primary hover:bg-surface hover:brightness-105"
          >
            <Link href={signedIn ? "/offers" : "/register"}>
              {signedIn ? "See your offers" : "Create an account"}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="border-white/60 text-white hover:bg-white/15 hover:text-white dark:border-black/25 dark:text-[#2a1204]"
          >
            <Link href="/restaurants">Browse places</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
