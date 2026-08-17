"use client";

import {
  ArrowRight,
  CakeSlice,
  Clock3,
  Coffee,
  CupSoda,
  Drumstick,
  Fish,
  Flame,
  Pizza,
  Salad,
  Sandwich,
  Search,
  ShieldCheck,
  Soup,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/status-pill";

/**
 * The storefront's opening screen: one promise, one search box, two ways in.
 *
 * The art on the right is drawn rather than photographed — there is no image
 * pipeline here yet, and a stock food photo that ships broken on a slow
 * connection is worse than a composition that always renders.
 */
export function Hero() {
  const router = useRouter();
  const [term, setTerm] = React.useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = term.trim();
    router.push(query === "" ? "/restaurants" : `/restaurants?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="gradient-hero relative isolate overflow-hidden">
      <div aria-hidden className="grid-backdrop absolute inset-0 -z-10 opacity-60" />

      <div className="container-zass grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <RevealGroup trigger="mount" className="flex flex-col items-start gap-6">
          <RevealItem>
            <Badge variant="warm" className="gap-2">
              <Flame aria-hidden className="size-3.5" />
              Fresh &amp; hot, straight from the kitchen
            </Badge>
          </RevealItem>

          <RevealItem>
            <h1 className="max-w-2xl text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-[4.25rem]">
              Good food,{" "}
              <span className="text-gradient-brand italic">delivered</span> fast to your door
            </h1>
          </RevealItem>

          <RevealItem>
            <p className="max-w-lg text-lg leading-relaxed text-secondary">
              Order from the restaurants you already love, follow your rider the whole way, and pay
              however suits you.
            </p>
          </RevealItem>

          <RevealItem className="w-full max-w-xl">
            <form onSubmit={submit} role="search" className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <label htmlFor="hero-search" className="sr-only">
                  Search restaurants or dishes
                </label>
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
                />
                <input
                  id="hero-search"
                  type="search"
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder="Search for biryani, pizza or a restaurant"
                  className="h-14 w-full rounded-full border border-border-default bg-surface pl-12 pr-4 text-[0.9375rem] text-primary shadow-card transition-all placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-[var(--brand-ring)]"
                />
              </div>
              <Button type="submit" size="lg" variant="neon" className="h-14 rounded-full px-8">
                Order now
                <ArrowRight aria-hidden className="size-4" />
              </Button>
            </form>
          </RevealItem>

          <RevealItem className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1 text-sm font-semibold text-secondary">
            <span className="inline-flex items-center gap-2">
              <Truck aria-hidden className="size-4 text-brand" />
              Live rider tracking
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 aria-hidden className="size-4 text-brand" />
              Kitchen-fresh prep times
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck aria-hidden className="size-4 text-brand" />
              Cash or card on delivery
            </span>
          </RevealItem>
        </RevealGroup>

        <Reveal trigger="mount" delay={0.15} className="relative mx-auto w-full max-w-md lg:max-w-none">
          <HeroArt />
        </Reveal>
      </div>
    </section>
  );
}

/**
 * The plate: concentric rings behind a grid of dish tiles. Purely decorative,
 * so it is hidden from assistive tech entirely.
 *
 * Drawn icons rather than emoji — emoji depend on a font the visitor may not
 * have, and the fallback for a missing one is a row of tofu boxes.
 */
function HeroArt() {
  const dishes = [
    { icon: <Pizza />, tone: "text-accent-warm" },
    { icon: <Sandwich />, tone: "text-accent-gold" },
    { icon: <Drumstick />, tone: "text-brand" },
    { icon: <CupSoda />, tone: "text-brand" },
    { icon: <Soup />, tone: "text-accent-warm" },
    { icon: <Salad />, tone: "text-success" },
    { icon: <CakeSlice />, tone: "text-accent-violet" },
    { icon: <Coffee />, tone: "text-accent-gold" },
    { icon: <Fish />, tone: "text-brand" },
  ] as const;

  return (
    <div aria-hidden className="relative aspect-square w-full">
      <div className="hero-plate hero-plate-spin absolute inset-0 rounded-full blur-[2px]" />
      <div className="absolute inset-[12%] rounded-full border border-border-subtle bg-surface/70 backdrop-blur-sm" />
      <div className="absolute inset-[22%] rounded-full border border-dashed border-border-default" />

      <div className="absolute inset-[18%] grid grid-cols-3 place-items-center gap-2">
        {dishes.map((dish, index) => (
          <span
            key={index}
            className={`grid size-[74%] place-items-center rounded-2xl bg-surface shadow-card [&>svg]:size-8 sm:[&>svg]:size-10 ${dish.tone}`}
            style={{ transform: `rotate(${((index % 3) - 1) * 4}deg)` }}
          >
            {dish.icon}
          </span>
        ))}
      </div>

      {/* Product facts, not figures — nothing here claims a number the API
          has not actually returned for a real restaurant. */}
      <span className="absolute -left-2 top-[18%] rounded-full bg-surface px-4 py-2 text-sm font-bold text-primary shadow-panel">
        Track your rider
      </span>
      <span className="absolute -right-1 bottom-[16%] rounded-full bg-surface px-4 py-2 text-sm font-bold text-primary shadow-panel">
        Pay your way
      </span>
    </div>
  );
}
