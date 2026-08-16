import Link from "next/link";

import { Button } from "@/components/ui/button";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/status-pill";

/**
 * Placeholder home.
 *
 * The real hero, categories, featured restaurants and offers band are Phase 3 —
 * they need /banners, /restaurants/categories, /search/popular and
 * /coupons/available, and §5.2 is explicit that none of it may be fabricated in
 * the meantime. This stands the shell up without inventing a single figure.
 */
export default function HomePage() {
  return (
    <section className="gradient-hero">
      <RevealGroup
        trigger="mount"
        className="container-zass flex min-h-[70vh] flex-col items-start justify-center gap-6 py-24"
      >
        <RevealItem>
          <Badge variant="soft">Phase 1 · Design system &amp; shell</Badge>
        </RevealItem>

        <RevealItem>
          <h1 className="max-w-3xl text-5xl leading-[1.05] lg:text-7xl">
            Your cravings.
            <br />
            <span className="text-gradient-brand">Delivered.</span>
          </h1>
        </RevealItem>

        <RevealItem>
          <p className="max-w-xl text-lg leading-relaxed text-secondary">
            The storefront lands in Phase 3, once the restaurant, category and search endpoints are
            wired up. For now, the foundation this whole app is built on is ready to review.
          </p>
        </RevealItem>

        <RevealItem className="flex flex-wrap items-center gap-3 pt-2">
          <Button size="lg" variant="gradient" asChild>
            <Link href="/design-system">View the design system</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
