"use client";

import { useRouter, usePathname } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { homeRouteForRole, type UserRole } from "@/types/auth";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles allowed here. Omit to require only that someone is signed in. */
  roles?: readonly UserRole[];
  /**
   * Permission codes the user must hold (§8: gate on permissions from
   * /auth/me, not on role alone). All of them are required.
   */
  permissions?: readonly string[];
}

/**
 * Client-side role guard.
 *
 * This is a UX guard, not a security boundary — the API authorises every
 * request independently, which is what actually protects the data. Its job is
 * to stop a rider ever seeing an admin shell flash before the API says no.
 */
export function ProtectedRoute({ children, roles, permissions }: ProtectedRouteProps) {
  const { user, isAuthenticated, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isReady || isAuthenticated) {
      return;
    }

    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isReady, isAuthenticated, pathname, router]);

  if (!isReady) {
    return <RouteGuardSkeleton />;
  }

  if (!isAuthenticated || user === null) {
    // The redirect above is in flight; showing the skeleton avoids a flash of
    // "not allowed" for someone who simply is not signed in yet.
    return <RouteGuardSkeleton />;
  }

  const roleAllowed = roles === undefined || roles.includes(user.role);
  const permissionsHeld =
    permissions === undefined || permissions.every((code) => user.permissions.includes(code));

  if (!roleAllowed || !permissionsHeld) {
    return (
      <div className="container-zass">
        <EmptyState
          icon={<span className="text-3xl">🔒</span>}
          title="This area isn't yours"
          description={
            roleAllowed
              ? "Your account doesn't have the permissions this page needs. If that seems wrong, ask an administrator to check your access."
              : "You're signed in with an account that doesn't have access to this part of ZassDelivery."
          }
          action={
            <Button onClick={() => router.replace(homeRouteForRole(user))}>
              Go to your dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}

function RouteGuardSkeleton() {
  return (
    <div className="container-zass py-10" role="status" aria-busy aria-live="polite">
      <span className="sr-only">Checking your access</span>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-[var(--radius-card)]" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-[var(--radius-panel)]" />
      </div>
    </div>
  );
}
