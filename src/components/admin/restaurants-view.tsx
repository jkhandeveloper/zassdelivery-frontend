"use client";

import { Check, ExternalLink, Pause, Play, Store, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import {
  CellStack,
  DataTable,
  Pagination,
  RowActions,
  type Column,
} from "@/components/admin/data-table";
import { FilterBar, SearchInput, SelectFilter } from "@/components/admin/filter-bar";
import { ConfirmDialog, ReasonDialog } from "@/components/admin/reason-dialog";
import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import {
  useAdminRestaurants,
  useApproveRestaurant,
  useChangeRestaurantStatus,
  useRejectRestaurant,
} from "@/hooks/use-admin";
import { useValueChanged } from "@/hooks/use-value-changed";
import { businessTypeLabel, BUSINESS_TYPE_ORDER } from "@/lib/business-types";
import { formatDate } from "@/lib/utils";
import { BusinessType, RestaurantStatus } from "@/types/enums";
import type { RestaurantAdminDto } from "@/types/restaurant";

/**
 * The approval queue and every business on the platform.
 *
 * Lands on the pending filter when the dashboard sent the operator here, and on
 * everything otherwise — the same screen answers "what needs approving" and
 * "find me that bakery in Pabbi", and which of the two it opens as should follow
 * the question that was asked.
 */
export function AdminRestaurantsView() {
  const params = useSearchParams();
  const initialStatus = params.get("status");

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<RestaurantStatus | "">(
    isRestaurantStatus(initialStatus) ? initialStatus : "",
  );
  const [businessType, setBusinessType] = React.useState<BusinessType | "">("");
  const [page, setPage] = React.useState(1);

  // Any filter change invalidates the page number — page 4 of a narrower list
  // is usually empty, and an empty list reads as "no results" rather than
  // "you are past the end".
  if (useValueChanged(`${search}|${status}|${businessType}`) && page !== 1) {
    setPage(1);
  }

  const restaurants = useAdminRestaurants({
    page,
    limit: 20,
    search: search === "" ? undefined : search,
    status: status === "" ? undefined : status,
    businessType: businessType === "" ? undefined : businessType,
  });

  const approve = useApproveRestaurant();
  const reject = useRejectRestaurant();
  const changeStatus = useChangeRestaurantStatus();

  const [approving, setApproving] = React.useState<RestaurantAdminDto | null>(null);
  const [rejecting, setRejecting] = React.useState<RestaurantAdminDto | null>(null);
  const [suspending, setSuspending] = React.useState<RestaurantAdminDto | null>(null);

  const filtered = search !== "" || status !== "" || businessType !== "";

  const columns: readonly Column<RestaurantAdminDto>[] = [
    {
      key: "name",
      header: "Business",
      cell: (row) => (
        <CellStack
          primary={row.name}
          secondary={`${row.zone.name}, ${row.city.name} · ${row.phone}`}
        />
      ),
    },
    {
      key: "type",
      header: "Type",
      hideBelow: "lg",
      cell: (row) => (
        <span className="text-secondary">{businessTypeLabel(row.businessType)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill status={row.status} size="sm" />
          {row.status === RestaurantStatus.ACTIVE && !row.isAcceptingOrders && (
            <span className="text-xs text-muted">Paused by owner</span>
          )}
        </div>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      align: "right",
      hideBelow: "md",
      cell: (row) => (
        <span className="numeric text-secondary">
          {row.ratingCount === 0 ? "—" : `${row.rating.toFixed(1)} (${row.ratingCount})`}
        </span>
      ),
    },
    {
      key: "commission",
      header: "Commission",
      align: "right",
      hideBelow: "xl",
      cell: (row) => <span className="numeric text-secondary">{row.commissionRate}%</span>,
    },
    {
      key: "submitted",
      header: "Applied",
      align: "right",
      hideBelow: "lg",
      cell: (row) => (
        <span className="numeric text-xs text-muted">
          {formatDate(row.submittedAt ?? row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: "1%",
      cell: (row) => (
        <RowActions>
          {row.status === RestaurantStatus.PENDING_APPROVAL && (
            <>
              <Button size="sm" variant="success" onClick={() => setApproving(row)}>
                <Check className="size-4" />
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRejecting(row)}>
                <X className="size-4" />
                Reject
              </Button>
            </>
          )}

          {row.status === RestaurantStatus.ACTIVE && (
            <Button size="sm" variant="outline" onClick={() => setSuspending(row)}>
              <Pause className="size-4" />
              Suspend
            </Button>
          )}

          {(row.status === RestaurantStatus.SUSPENDED ||
            row.status === RestaurantStatus.TEMPORARILY_CLOSED) && (
            <Button
              size="sm"
              variant="outline"
              loading={changeStatus.isPending}
              onClick={() =>
                changeStatus.mutate({
                  id: row.id,
                  data: { status: RestaurantStatus.ACTIVE, reason: "Reinstated by admin" },
                })
              }
            >
              <Play className="size-4" />
              Reinstate
            </Button>
          )}

          <Button size="sm" variant="ghost" asChild>
            <Link href={`/restaurants/${row.slug}`} target="_blank">
              <ExternalLink className="size-4" />
              <span className="sr-only">View {row.name} on the storefront</span>
            </Link>
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Restaurants"
        description="The approval queue and every business on the platform — restaurants, bakeries, cafes and shops."
      />

      <Panel bodyClassName="p-0">
        <div className="border-b border-border-subtle p-5 sm:p-6">
          <FilterBar
            onClear={
              filtered
                ? () => {
                    setSearch("");
                    setStatus("");
                    setBusinessType("");
                  }
                : undefined
            }
          >
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name or phone"
            />
            <SelectFilter
              label="Status"
              value={status}
              onChange={setStatus}
              allLabel="Any status"
              options={[
                { value: RestaurantStatus.PENDING_APPROVAL, label: "Pending approval" },
                { value: RestaurantStatus.ACTIVE, label: "Active" },
                { value: RestaurantStatus.SUSPENDED, label: "Suspended" },
                { value: RestaurantStatus.TEMPORARILY_CLOSED, label: "Temporarily closed" },
                { value: RestaurantStatus.REJECTED, label: "Rejected" },
              ]}
            />
            <SelectFilter
              label="Business type"
              value={businessType}
              onChange={setBusinessType}
              allLabel="Any type"
              options={BUSINESS_TYPE_ORDER.map((type) => ({
                value: type,
                label: businessTypeLabel(type),
              }))}
            />
          </FilterBar>
        </div>

        <DataTable
          caption="Businesses on the platform, with their approval status"
          columns={columns}
          rows={restaurants.data?.items}
          rowKey={(row) => row.id}
          isPending={restaurants.isPending}
          isError={restaurants.isError}
          error={restaurants.error}
          onRetry={() => void restaurants.refetch()}
          empty={{
            icon: <Store className="size-6" />,
            title: filtered ? "No businesses match those filters" : "No businesses yet",
            description: filtered
              ? "Try a wider search, or clear the filters."
              : "Applications appear here as soon as an owner submits one.",
          }}
          footer={<Pagination meta={restaurants.data?.meta} onPageChange={setPage} />}
        />
      </Panel>

      <ConfirmDialog
        open={approving !== null}
        onOpenChange={(open) => !open && setApproving(null)}
        title={`Approve ${approving?.name ?? ""}?`}
        description="They will appear in search straight away and can start taking orders as soon as they open."
        confirmLabel="Approve"
        variant="success"
        pending={approve.isPending}
        successMessage="Approved. They can take orders now."
        onConfirm={() => approve.mutateAsync(approving?.id ?? "")}
      />

      <ReasonDialog
        open={rejecting !== null}
        onOpenChange={(open) => !open && setRejecting(null)}
        title={`Reject ${rejecting?.name ?? ""}?`}
        description="The owner is shown this reason and can fix the problem and resubmit, so be specific about what is wrong."
        placeholder="e.g. The address does not match the location on the map."
        confirmLabel="Reject application"
        pending={reject.isPending}
        successMessage="Application rejected. The owner can resubmit."
        onConfirm={({ reason }) =>
          reject.mutateAsync({ id: rejecting?.id ?? "", data: { reason } })
        }
      />

      <ReasonDialog
        open={suspending !== null}
        onOpenChange={(open) => !open && setSuspending(null)}
        title={`Suspend ${suspending?.name ?? ""}?`}
        description="They come off the storefront immediately. Orders already placed are unaffected."
        placeholder="e.g. Repeated hygiene complaints, pending inspection."
        confirmLabel="Suspend"
        pending={changeStatus.isPending}
        successMessage="Suspended and removed from the storefront."
        onConfirm={({ reason }) =>
          changeStatus.mutateAsync({
            id: suspending?.id ?? "",
            data: { status: RestaurantStatus.SUSPENDED, reason },
          })
        }
      />
    </div>
  );
}

function isRestaurantStatus(value: string | null): value is RestaurantStatus {
  return value !== null && Object.values(RestaurantStatus).includes(value as RestaurantStatus);
}
