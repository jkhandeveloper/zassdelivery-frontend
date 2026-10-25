import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  className,
  showWordmark = true,
  tone = "default",
}: {
  href?: string;
  className?: string;
  showWordmark?: boolean;
  /** `inverse` for dark bands (footer, trust strip) where the canvas is dark. */
  tone?: "default" | "inverse";
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="ZassDelivery — home"
    >
      <Image
        src="/images/logo.png"
        alt=""
        width={44}
        height={44}
        loading="eager"
        className="size-11 shrink-0 transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      {showWordmark && (
        <span
          className={cn(
            "font-display text-xl font-extrabold tracking-tight",
            tone === "inverse" ? "text-white" : "text-primary",
          )}
        >
          Zass<span className="text-brand">Delivery</span>
        </span>
      )}
    </Link>
  );
}
