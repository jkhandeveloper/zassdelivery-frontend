"use client";

import { Bike, Check, ExternalLink, FileText, Pause, Play, X } from "lucide-react";
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
import { ListSkeleton } from "@/components/ui/skeleton";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Badge, StatusPill } from "@/components/ui/status-pill";
import {
  useAdminRiderDocuments,
  useAdminRiders,
  useApproveRider,
  useRejectRider,
  useRejectRiderDocument,
  useReinstateRider,
  useSuspendRider,
  useVerifyRiderDocument,
} from "@/hooks/use-admin";
import { useValueChanged } from "@/hooks/use-value-changed";
import { formatDate, formatRelative, hasText } from "@/lib/utils";
import { DriverAvailability, DriverDocumentStatus, DriverStatus } from "@/types/enums";
import type { RiderDocumentDto, RiderDto } from "@/types/rider";

const DOCUMENT_LABELS: Record<string, string> = {
  CNIC_FRONT: "CNIC — front",
  CNIC_BACK: "CNIC — back",
  DRIVING_LICENSE: "Driving licence",
  VEHICLE_REGISTRATION: "Vehicle registration",
  PROFILE_PHOTO: "Profile photo",
};

/**
 * Rider approvals, document verification and suspensions.
 *
 * Approval is gated on documents by the API, so the table shows what is still
 * missing rather than offering an Approve button that will be refused: the
 * operator's next action is opening the documents, not clicking and reading an
 * error.
 */
export function AdminRidersView() {
  const params = useSearchParams();
  const initialStatus = params.get("status");

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<DriverStatus | "">(
    isDriverStatus(initialStatus) ? initialStatus : "",
  );
  const [availability, setAvailability] = React.useState<DriverAvailability | "">("");
  const [page, setPage] = React.useState(1);

  if (useValueChanged(`${search}|${status}|${availability}`) && page !== 1) {
    setPage(1);
  }

  const riders = useAdminRiders({
    page,
    limit: 20,
    search: search === "" ? undefined : search,
    status: status === "" ? undefined : status,
    availability: availability === "" ? undefined : availability,
  });

  const approve = useApproveRider();
  const reject = useRejectRider();
  const suspend = useSuspendRider();
  const reinstate = useReinstateRider();

  const [approving, setApproving] = React.useState<RiderDto | null>(null);
  const [rejecting, setRejecting] = React.useState<RiderDto | null>(null);
  const [suspending, setSuspending] = React.useState<RiderDto | null>(null);
  const [viewingDocs, setViewingDocs] = React.useState<RiderDto | null>(null);

  const filtered = search !== "" || status !== "" || availability !== "";

  const columns: readonly Column<RiderDto>[] = [
    {
      key: "rider",
      header: "Rider",
      cell: (row) => <CellStack primary={row.fullName} secondary={`${row.phone} · ${row.cnic}`} />,
    },
    {
      key: "zone",
      header: "Zone",
      hideBelow: "lg",
      cell: (row) => (
        <span className="text-secondary">{hasText(row.zoneName) ? row.zoneName : "Unassigned"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusPill status={row.status} label={row.statusText} size="sm" />,
    },
    {
      key: "availability",
      header: "Right now",
      hideBelow: "md",
      cell: (row) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill status={row.availability} size="sm" withDot />
          {row.availability !== DriverAvailability.OFFLINE && row.onlineSince !== null && (
            <span className="text-xs text-muted">since {formatRelative(row.onlineSince)}</span>
          )}
        </div>
      ),
    },
    {
      key: "documents",
      header: "Documents",
      hideBelow: "xl",
      cell: (row) =>
        row.missingDocuments.length === 0 ? (
          <Badge variant="soft" size="sm">
            All verified
          </Badge>
        ) : (
          <span className="text-xs text-warning">
            {row.missingDocuments.length} outstanding
          </span>
        ),
    },
    {
      key: "deliveries",
      header: "Deliveries",
      align: "right",
      hideBelow: "lg",
      cell: (row) => (
        <span className="numeric text-secondary">
          {row.totalDeliveries}
          {row.ratingCount > 0 && (
            <span className="pl-2 text-xs text-muted">★ {row.rating.toFixed(1)}</span>
          )}
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
          <Button size="sm" variant="ghost" onClick={() => setViewingDocs(row)}>
            <FileText className="size-4" />
            Documents
          </Button>

          {row.status === DriverStatus.PENDING_APPROVAL && (
            <>
              <Button
                size="sm"
                variant="success"
                disabled={row.missingDocuments.length > 0}
                title={
                  row.missingDocuments.length > 0
                    ? "Verify their documents first"
                    : undefined
                }
                onClick={() => setApproving(row)}
              >
                <Check className="size-4" />
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRejecting(row)}>
                <X className="size-4" />
                Reject
              </Button>
            </>
          )}

          {row.status === DriverStatus.ACTIVE && (
            <Button size="sm" variant="outline" onClick={() => setSuspending(row)}>
              <Pause className="size-4" />
              Suspend
            </Button>
          )}

          {(row.status === DriverStatus.SUSPENDED || row.status === DriverStatus.REJECTED) && (
            <Button
              size="sm"
              variant="outline"
              loading={reinstate.isPending}
              onClick={() => reinstate.mutate(row.id)}
            >
              <Play className="size-4" />
              Reinstate
            </Button>
          )}
        </RowActions>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Riders"
        description="Rider approvals, document verification and suspensions."
      />

      <Panel bodyClassName="p-0">
        <div className="border-b border-border-subtle p-5 sm:p-6">
          <FilterBar
            onClear={
              filtered
                ? () => {
                    setSearch("");
                    setStatus("");
                    setAvailability("");
                  }
                : undefined
            }
          >
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name or phone" />
            <SelectFilter
              label="Status"
              value={status}
              onChange={setStatus}
              allLabel="Any status"
              options={[
                { value: DriverStatus.PENDING_APPROVAL, label: "Pending approval" },
                { value: DriverStatus.ACTIVE, label: "Active" },
                { value: DriverStatus.SUSPENDED, label: "Suspended" },
                { value: DriverStatus.REJECTED, label: "Rejected" },
              ]}
            />
            <SelectFilter
              label="Availability"
              value={availability}
              onChange={setAvailability}
              allLabel="Any availability"
              options={[
                { value: DriverAvailability.ONLINE, label: "Online" },
                { value: DriverAvailability.ON_DELIVERY, label: "On delivery" },
                { value: DriverAvailability.ON_BREAK, label: "On break" },
                { value: DriverAvailability.OFFLINE, label: "Offline" },
              ]}
            />
          </FilterBar>
        </div>

        <DataTable
          caption="Riders, with their approval status and availability"
          columns={columns}
          rows={riders.data?.items}
          rowKey={(row) => row.id}
          isPending={riders.isPending}
          isError={riders.isError}
          error={riders.error}
          onRetry={() => void riders.refetch()}
          empty={{
            icon: <Bike className="size-6" />,
            title: filtered ? "No riders match those filters" : "No riders yet",
            description: filtered
              ? "Try a wider search, or clear the filters."
              : "Applications appear here as soon as somebody signs up to ride.",
          }}
          footer={<Pagination meta={riders.data?.meta} onPageChange={setPage} />}
        />
      </Panel>

      <DocumentsModal rider={viewingDocs} onClose={() => setViewingDocs(null)} />

      <ConfirmDialog
        open={approving !== null}
        onOpenChange={(open) => !open && setApproving(null)}
        title={`Approve ${approving?.fullName ?? ""}?`}
        description="They will be able to go online and start receiving delivery offers."
        confirmLabel="Approve"
        variant="success"
        pending={approve.isPending}
        successMessage="Approved. They can go online now."
        onConfirm={() => approve.mutateAsync(approving?.id ?? "")}
      />

      <ReasonDialog
        open={rejecting !== null}
        onOpenChange={(open) => !open && setRejecting(null)}
        title={`Reject ${rejecting?.fullName ?? ""}?`}
        description="The rider is shown this reason and can correct it and reapply."
        placeholder="e.g. The CNIC photo is too blurred to read."
        confirmLabel="Reject application"
        pending={reject.isPending}
        successMessage="Application rejected."
        onConfirm={({ reason }) =>
          reject.mutateAsync({ id: rejecting?.id ?? "", data: { reason } })
        }
      />

      <ReasonDialog
        open={suspending !== null}
        onOpenChange={(open) => !open && setSuspending(null)}
        title={`Suspend ${suspending?.fullName ?? ""}?`}
        description="They go offline immediately and stop receiving offers. Any run already accepted still needs finishing."
        placeholder="e.g. Two undelivered orders marked as delivered."
        confirmLabel="Suspend"
        pending={suspend.isPending}
        successMessage="Suspended and taken offline."
        onConfirm={({ reason }) =>
          suspend.mutateAsync({ id: suspending?.id ?? "", data: { reason } })
        }
      />
    </div>
  );
}

/**
 * One rider's documents, verified or rejected one at a time.
 *
 * Kept in a modal rather than expanded in the row because verification is a
 * reading task — the operator is looking at a photo of a CNIC, not scanning a
 * list — and an expired licence is called out as such: the API returns
 * `isExpired` precisely because a verified-but-lapsed document is the failure
 * mode a date column alone lets through.
 */
function DocumentsModal({
  rider,
  onClose,
}: {
  rider: RiderDto | null;
  onClose: () => void;
}) {
  const documents = useAdminRiderDocuments(rider?.id ?? null);
  const verify = useVerifyRiderDocument();
  const rejectDocument = useRejectRiderDocument();

  const [rejecting, setRejecting] = React.useState<RiderDocumentDto | null>(null);

  return (
    <>
      <Modal open={rider !== null} onOpenChange={(open) => !open && onClose()}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>{rider?.fullName ?? "Documents"}</ModalTitle>
            <ModalDescription>
              {rider === null
                ? null
                : rider.missingDocuments.length === 0
                  ? "Every required document is verified."
                  : `Still outstanding: ${rider.missingDocuments
                      .map((type) => DOCUMENT_LABELS[type] ?? type)
                      .join(", ")}.`}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="pb-6">
            {documents.isPending ? (
              <ListSkeleton count={3} label="Loading documents" />
            ) : documents.isError ? (
              <ErrorState
                density="inline"
                error={documents.error}
                onRetry={() => void documents.refetch()}
              />
            ) : (documents.data ?? []).length === 0 ? (
              <EmptyState
                density="inline"
                icon={<FileText className="size-6" />}
                title="Nothing uploaded yet"
                description="The rider has not submitted any documents."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {(documents.data ?? []).map((document) => (
                  <li
                    key={document.id}
                    className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-border-subtle p-4"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-semibold text-primary">
                        {DOCUMENT_LABELS[document.type] ?? document.type}
                      </span>
                      <span className="numeric text-xs text-muted">
                        {hasText(document.number) ? `${document.number} · ` : ""}
                        {document.expiresAt === null
                          ? "No expiry"
                          : `Expires ${formatDate(document.expiresAt)}`}
                      </span>
                      {hasText(document.rejectionReason) && (
                        <span className="text-xs text-danger">{document.rejectionReason}</span>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {document.isExpired ? (
                        <StatusPill status="EXPIRED" size="sm" />
                      ) : (
                        <StatusPill status={document.status} size="sm" />
                      )}

                      <Button size="sm" variant="ghost" asChild>
                        <a href={document.fileUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-4" />
                          Open
                        </a>
                      </Button>

                      {document.status !== DriverDocumentStatus.VERIFIED && (
                        <Button
                          size="sm"
                          variant="success"
                          loading={verify.isPending}
                          onClick={() => verify.mutate(document.id)}
                        >
                          <Check className="size-4" />
                          Verify
                        </Button>
                      )}

                      {document.status !== DriverDocumentStatus.REJECTED && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejecting(document)}
                        >
                          <X className="size-4" />
                          Reject
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <ReasonDialog
        open={rejecting !== null}
        onOpenChange={(open) => !open && setRejecting(null)}
        title="Reject this document?"
        description="The rider is shown this reason and can upload a replacement."
        placeholder="e.g. The expiry date is not visible in the photo."
        confirmLabel="Reject document"
        pending={rejectDocument.isPending}
        successMessage="Document rejected. The rider can re-upload."
        onConfirm={({ reason }) =>
          rejectDocument.mutateAsync({
            documentId: rejecting?.id ?? "",
            data: { reason },
          })
        }
      />
    </>
  );
}

function isDriverStatus(value: string | null): value is DriverStatus {
  return value !== null && Object.values(DriverStatus).includes(value as DriverStatus);
}
