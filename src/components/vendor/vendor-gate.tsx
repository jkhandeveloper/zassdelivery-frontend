"use client";

import { Hourglass, ShieldX, Store } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { useVendorRestaurant } from "@/hooks/use-vendor-restaurant";
import { useResubmitRestaurant } from "@/hooks/use-vendor";
import { ApiError } from "@/lib/api-client";
import { formatDateTime, hasText } from "@/lib/utils";
import { RestaurantStatus } from "@/types/enums";
import type { RestaurantAdminDto } from "@/types/restaurant";

/**
 * What stands between a signed-in vendor and the working screens.
 *
 * A VENDOR_OWNER account and a live listing are two different things: the owner
 * registers the restaurant themselves with `POST /restaurant-management`, which
 * creates it in PENDING_APPROVAL, and an administrator approves or rejects it.
 * Nothing goes live on its own, and an administrator never registers on the
 * owner's behalf — so "no listing yet" is a form, not an error.
 *
 * `allowUnapproved` lets the screens an owner needs *while* waiting — their
 * profile, hours and menu — render behind the banner rather than being locked
 * out of the very setup that approval is waiting on.
 */
export function VendorGate({
  allowUnapproved = false,
  children,
}: {
  allowUnapproved?: boolean;
  children: (restaurant: RestaurantAdminDto) => React.ReactNode;
}) {
  const { restaurant, isPending, isError, error, needsRegistration, refetch } =
    useVendorRestaurant();
  const resubmit = useResubmitRestaurant();

  if (isPending) {
    return (
      <SkeletonRegion label="Loading your restaurant" className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-[var(--radius-card)]" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-[var(--radius-panel)]" />
      </SkeletonRegion>
    );
  }

  if (needsRegistration) {
    return (
      <EmptyState
        icon={<Store className="size-8" />}
        title="Register your restaurant"
        description="Your owner account is ready. Add your kitchen's details and we'll review the listing — you register it yourself, an administrator only approves it."
        action={
          <Button asChild>
            <Link href="/vendor/onboarding">Register my restaurant</Link>
          </Button>
        }
      />
    );
  }

  if (isError || restaurant === null) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  if (restaurant.status === RestaurantStatus.REJECTED) {
    return (
      <div className="flex flex-col gap-6">
        <PortalHeader
          title={restaurant.name}
          description="This listing wasn't approved."
          action={<StatusPill status={restaurant.status} />}
        />

        <Panel title="Why it was turned down">
          <p className="text-[0.9375rem] leading-relaxed text-secondary">
            {hasText(restaurant.rejectionReason)
              ? restaurant.rejectionReason
              : "No reason was recorded. Support can tell you what needs changing."}
          </p>
        </Panel>

        <Panel
          title="Put it right and try again"
          description="Update whatever was wrong, then send the listing back for review."
        >
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/vendor/settings/profile">Edit my details</Link>
            </Button>
            <Button
              loading={resubmit.isPending}
              onClick={() =>
                resubmit.mutate(restaurant.id, {
                  onSuccess: () => toast.success("Sent back for review"),
                  onError: (error) =>
                    toast.error(
                      error instanceof ApiError
                        ? error.message
                        : "We couldn't resubmit your listing.",
                    ),
                })
              }
            >
              Resubmit for review
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  if (restaurant.status === RestaurantStatus.SUSPENDED) {
    return (
      <EmptyState
        icon={<ShieldX className="size-8 text-danger" />}
        title="This listing is suspended"
        description={
          hasText(restaurant.rejectionReason)
            ? restaurant.rejectionReason
            : "Your restaurant isn't taking orders right now. Support can explain what happened."
        }
        action={
          <Button asChild variant="outline">
            <Link href="/vendor/support">Contact support</Link>
          </Button>
        }
      />
    );
  }

  const awaitingApproval = restaurant.status === RestaurantStatus.PENDING_APPROVAL;

  if (awaitingApproval && !allowUnapproved) {
    return (
      <div className="flex flex-col gap-6">
        <PortalHeader
          title={restaurant.name}
          description="Your listing is with us for review."
          action={<StatusPill status={restaurant.status} />}
        />

        <Panel
          title="Waiting on approval"
          description="An administrator reviews every restaurant by hand. Nothing goes live until they approve it."
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 rounded-[var(--radius-input)] bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
              <Hourglass aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                Submitted {formatDateTime(restaurant.submittedAt)}. You can keep setting up in
                the meantime — your menu, hours and photos are all editable now.
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/vendor/settings/profile">Restaurant details</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/vendor/settings/hours">Opening hours</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/vendor/menu">Build the menu</Link>
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <>
      {awaitingApproval && (
        <div className="mb-6 flex items-start gap-3 rounded-[var(--radius-input)] bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
          <Hourglass aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            This listing is still awaiting approval, so it isn&apos;t visible to customers yet.
            Everything you set up here is saved and goes live the moment it&apos;s approved.
          </span>
        </div>
      )}
      {children(restaurant)}
    </>
  );
}
