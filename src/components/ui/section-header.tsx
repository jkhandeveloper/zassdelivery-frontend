import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The heading that opens every storefront rail: title on the left, one way
 * onward on the right. Used verbatim by "Top restaurants", "Popular near you"
 * and the menu sections, so the rhythm down the page never drifts.
 */
export function SectionHeader({
  title,
  description,
  viewAllHref,
  viewAllLabel = "View all",
  action,
  className,
}: {
  title: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl sm:text-[1.75rem]">{title}</h2>
        {description !== undefined && (
          <p className="text-[0.9375rem] text-secondary">{description}</p>
        )}
      </div>

      {action ??
        (viewAllHref !== undefined && (
          <Link
            href={viewAllHref}
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-brand transition-colors hover:text-brand-hover"
          >
            {viewAllLabel}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </Link>
        ))}
    </div>
  );
}
