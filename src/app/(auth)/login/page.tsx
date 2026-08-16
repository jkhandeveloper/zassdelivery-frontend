import Link from "next/link";

import { Button } from "@/components/ui/button";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";

export const metadata = { title: "Sign in" };

/**
 * Placeholder. The real form is Phase 2 — it needs the login DTO, the
 * five-attempt lockout countdown and the role-based redirect, none of which
 * belong in a shell.
 */
export default function LoginPage() {
  return (
    <RevealGroup trigger="mount" className="flex flex-col gap-6">
      <RevealItem className="flex flex-col gap-2">
        <h1 className="text-3xl">Welcome back</h1>
        <p className="text-secondary">
          Sign-in arrives in Phase 2, wired to <code className="text-brand">POST /auth/login</code>.
        </p>
      </RevealItem>

      <RevealItem className="rounded-[var(--radius-card)] border border-dashed border-border-strong bg-surface-muted p-6 text-sm text-secondary">
        The auth layout, session store, token-refresh interceptor and route guards behind this
        screen are already in place — only the form itself is outstanding.
      </RevealItem>

      <RevealItem>
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </RevealItem>
    </RevealGroup>
  );
}
