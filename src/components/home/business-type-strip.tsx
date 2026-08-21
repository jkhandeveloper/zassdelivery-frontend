import Link from "next/link";

import { BUSINESS_TYPES, BUSINESS_TYPE_ORDER } from "@/lib/business-types";

const TILE =
  "group flex min-h-[7.5rem] w-28 shrink-0 flex-col items-center gap-2 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 shadow-card transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-brand/40 hover:shadow-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transform-none motion-reduce:transition-none";

/**
 * Browse by the kind of place rather than by cuisine.
 *
 * The cuisine strip above it answers "what do I feel like eating"; this one
 * answers "what sort of shop do I need" — the question someone after a birthday
 * cake or a morning loaf is actually asking, and the one the platform could not
 * answer while every listing was a restaurant.
 *
 * Static: the set of types is an enum the frontend already holds, so there is
 * nothing to fetch and nothing to fail.
 */
export function BusinessTypeStrip() {
  return (
    <div className="no-scrollbar rail -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
      {BUSINESS_TYPE_ORDER.map((type) => {
        const { label, icon: Icon } = BUSINESS_TYPES[type];

        return (
          <Link key={type} href={`/restaurants?type=${type}`} className={TILE}>
            <span className="grid size-12 place-items-center rounded-2xl bg-accent-warm-soft text-accent-warm transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none">
              <Icon aria-hidden className="size-5" />
            </span>
            {/* Two lines, not an ellipsis: "Dessert parlour" and "Cloud kitchen"
                are meaningless truncated to "Dessert…". */}
            <span className="line-clamp-2 text-balance text-center text-xs font-bold leading-snug text-primary">
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
