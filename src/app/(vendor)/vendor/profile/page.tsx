"use client";

import { Store } from "lucide-react";
import Link from "next/link";

import { PasswordForm } from "@/components/account/password-form";
import { ProfileForm } from "@/components/account/profile-panel";
import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { useVendorRestaurant } from "@/hooks/use-vendor-restaurant";
import { BUSINESS_TYPES } from "@/lib/business-types";
import { hasText } from "@/lib/utils";
import { UserRole } from "@/types/auth";

/**
 * The person behind the business — their own name, photo, email and password.
 *
 * Separate from `/vendor/settings/profile`, which is the *business's* details
 * as customers see them. An owner needs both, and until this page existed the
 * only way to change their own name or password was to have support do it.
 *
 * Not behind `VendorGate`: the account belongs to the person, so it has to stay
 * reachable while the listing is pending, rejected or suspended — and it works
 * the same for kitchen staff, who have an account but no listing of their own.
 */
export default function VendorAccountPage() {
  const { user } = useAuth();
  const isOwner = user?.role === UserRole.VENDOR_OWNER;

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="My profile"
        description={
          isOwner
            ? "Your own account as the owner. Your business's details are under Business profile."
            : "Your own account. The business's details are managed by its owner."
        }
      />

      <Panel title="Account" description="How your name appears to riders, staff and support.">
        <ProfileForm />
      </Panel>

      <BusinessSummary isOwner={isOwner} />

      <Panel title="Password" description="Changing it signs you out on your other devices.">
        <PasswordForm />
      </Panel>

      <Panel
        title="Sign out"
        description="Signing out here ends this session only — other devices stay signed in."
      >
        <SignOutRow />
      </Panel>
    </div>
  );
}

/** Which business this account runs, and the way to its own settings. */
function BusinessSummary({ isOwner }: { isOwner: boolean }) {
  const { restaurant, isPending, isError, error, needsRegistration, refetch } =
    useVendorRestaurant();

  return (
    <Panel
      title={isOwner ? "Your business" : "Where you work"}
      description={
        isOwner
          ? "The listing this account owns."
          : "The business your account is attached to."
      }
      action={
        restaurant !== null ? <StatusPill status={restaurant.status} size="sm" /> : undefined
      }
    >
      {isPending ? (
        <Skeleton className="h-20 rounded-[var(--radius-input)]" />
      ) : needsRegistration ? (
        <EmptyState
          density="inline"
          icon={<Store className="size-6" />}
          title="No business listed yet"
          description="Add your details and we'll review the listing."
          action={
            <Button asChild>
              <Link href="/vendor/onboarding">List my business</Link>
            </Button>
          }
        />
      ) : isError || restaurant === null ? (
        <ErrorState density="inline" error={error} onRetry={refetch} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-display text-lg font-extrabold text-primary">
              {restaurant.name}
            </span>
            <span className="text-sm text-secondary">
              {BUSINESS_TYPES[restaurant.businessType].label} · {restaurant.addressLine}
            </span>
            {hasText(restaurant.phone) && (
              <span className="numeric text-sm text-muted">{restaurant.phone}</span>
            )}
          </div>

          {isOwner && (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/vendor/settings/profile">Business profile</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/vendor/billing">Subscription</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function SignOutRow() {
  const { logout } = useAuth();

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => void logout()}>
        Sign out
      </Button>
      <Button variant="danger" onClick={() => void logout({ allDevices: true })}>
        Sign out everywhere
      </Button>
    </div>
  );
}
