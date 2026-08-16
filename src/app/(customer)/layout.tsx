import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

/**
 * The public storefront shell. Not guarded — home, restaurant listings and
 * restaurant pages are the SEO surface and must render for signed-out visitors.
 * The pages that do need a session (cart, orders, profile) guard themselves.
 */
export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
