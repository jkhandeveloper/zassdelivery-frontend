"use client";

import { ClipboardCheck, FileWarning, Hourglass, ShieldX } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { useResubmitRiderApproval, useRiderProfile } from "@/hooks/use-riders";
import { ApiError } from "@/lib/api-client";
import { hasText } from "@/lib/utils";
import { DriverStatus } from "@/types/enums";
import type { RiderDto } from "@/types/rider";

const DOCUMENT_LABELS: Record<string, string> = {
  CNIC_FRONT: "CNIC — front",
  CNIC_BACK: "CNIC — back",
  DRIVING_LICENSE: "Driving licence",
  VEHICLE_REGISTRATION: "Vehicle registration",
  PROFILE_PHOTO: "Profile photo",
};

/**
 * What stands between a signed-in rider and the working screens.
 *
 * A RIDER account and an approved rider are two different things: registration
 * creates the login, `POST /riders/register` creates the application, and an
 * administrator approves it. Each of those is a real state with something
 * different to say, so every rider screen renders through here rather than
 * each one guessing what a 404 from `/riders/me` meant.
 */
export function RiderGate({
  children,
}: {
  children: (rider: RiderDto) => React.ReactNode;
}) {
  const profile = useRiderProfile();
  const resubmit = useResubmitRiderApproval();

  if (profile.isPending) {
    return (
      <SkeletonRegion label="Loading your rider profile" className="flex flex-col gap-6">
        <Skeleton className="h-9 w-56" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-[var(--radius-card)]" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-[var(--radius-panel)]" />
      </SkeletonRegion>
    );
  }

  if (profile.isError) {
    const error = profile.error;
    // 404 is not "broken", it is "you have a rider login but never filed the
    // application" — the one state where the answer is a form, not a retry.
    const notRegistered = error instanceof ApiError && error.status === 404;

    if (notRegistered) {
      return (
        <EmptyState
          icon={<ClipboardCheck className="size-8" />}
          title="Finish your rider application"
          description="Your account is ready, but we still need your CNIC, vehicle and documents before you can take deliveries."
          action={
            <Button asChild>
              <Link href="/rider/onboarding">Start the application</Link>
            </Button>
          }
        />
      );
    }

    return <ErrorState error={error} onRetry={() => void profile.refetch()} />;
  }

  const rider = profile.data;

  if (rider.status === DriverStatus.REJECTED) {
    return (
      <div className="flex flex-col gap-6">
        <PortalHeader
          title="Application not approved"
          description={rider.statusText}
          action={<StatusPill status={rider.status} />}
        />

        <Panel title="What we were told">
          <p className="text-[0.9375rem] leading-relaxed text-secondary">
            {hasText(rider.rejectionReason)
              ? rider.rejectionReason
              : "No reason was recorded. Support can tell you what is missing."}
          </p>
        </Panel>

        <Panel
          title="Put it right and try again"
          description="Re-upload whatever was wrong, then send the application back for review."
        >
          <div className="flex flex-col gap-4">
            <MissingDocuments rider={rider} />
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/rider/onboarding">Update my documents</Link>
              </Button>
              <Button
                loading={resubmit.isPending}
                onClick={() =>
                  resubmit.mutate(undefined, {
                    onSuccess: () => toast.success("Sent back for review"),
                    onError: (error) =>
                      toast.error(
                        error instanceof ApiError
                          ? error.message
                          : "We couldn't resubmit your application.",
                      ),
                  })
                }
              >
                Resubmit for review
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  if (rider.status === DriverStatus.SUSPENDED) {
    return (
      <EmptyState
        icon={<ShieldX className="size-8 text-danger" />}
        title="Your account is suspended"
        description={
          hasText(rider.rejectionReason)
            ? rider.rejectionReason
            : "You can't take deliveries right now. Support can explain what happened and what comes next."
        }
        action={
          <Button asChild variant="outline">
            <Link href="/rider/support">Contact support</Link>
          </Button>
        }
      />
    );
  }

  if (rider.status === DriverStatus.PENDING_APPROVAL) {
    return (
      <div className="flex flex-col gap-6">
        <PortalHeader
          title={`Welcome, ${rider.fullName.split(" ")[0]}`}
          description={rider.statusText}
          action={<StatusPill status={rider.status} />}
        />

        <Panel
          title="Your application is with us"
          description="An administrator reviews every rider by hand. You'll be able to go online as soon as it's approved."
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 rounded-[var(--radius-input)] bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
              <Hourglass aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                Approval is an administrator&apos;s decision — there is nothing more for you to
                do once your documents are all verified.
              </span>
            </div>

            <MissingDocuments rider={rider} />
          </div>
        </Panel>
      </div>
    );
  }

  return <>{children(rider)}</>;
}

/** What is still outstanding. The API computes this; we only render it. */
function MissingDocuments({ rider }: { rider: RiderDto }) {
  if (rider.missingDocuments.length === 0) {
    return (
      <p className="text-sm text-secondary">
        Every document we need has been verified. Nothing else is outstanding.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm font-bold text-primary">
        <FileWarning aria-hidden className="size-4 text-warning" />
        Still needed before approval
      </p>
      <ul className="flex flex-col gap-2">
        {rider.missingDocuments.map((type) => (
          <li
            key={type}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-input)] border border-border-default bg-surface-muted px-3.5 py-2.5 text-sm"
          >
            <span className="font-semibold text-primary">{DOCUMENT_LABELS[type] ?? type}</span>
            <StatusPill status="PENDING" size="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}
