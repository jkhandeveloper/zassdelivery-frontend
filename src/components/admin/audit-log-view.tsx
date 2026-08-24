"use client";

import { ScrollText } from "lucide-react";
import * as React from "react";

import {
  CellStack,
  DataTable,
  Pagination,
  type Column,
} from "@/components/admin/data-table";
import { FilterBar, humaniseEnum, SelectFilter } from "@/components/admin/filter-bar";
import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Badge } from "@/components/ui/status-pill";
import { useAuditEntityTypes, useAuditLogs } from "@/hooks/use-admin";
import { useValueChanged } from "@/hooks/use-value-changed";
import { formatDateTime, hasText } from "@/lib/utils";
import { AuditAction } from "@/types/enums";
import type { AuditLogDto } from "@/types/support";

/**
 * What staff changed, and when.
 *
 * `before` / `after` are the whole record twice, not a per-field diff, so the
 * diff is computed here rather than trusted from the wire — showing only the
 * keys that actually changed is what makes a 40-field record readable as a
 * change log instead of two JSON dumps side by side.
 */
export function AdminAuditLogView() {
  const [action, setAction] = React.useState<AuditAction | "">("");
  const [entityType, setEntityType] = React.useState("");
  const [page, setPage] = React.useState(1);

  if (useValueChanged(`${action}|${entityType}`) && page !== 1) {
    setPage(1);
  }

  const entityTypes = useAuditEntityTypes();
  const logs = useAuditLogs({
    page,
    limit: 30,
    action: action === "" ? undefined : action,
    entityType: entityType === "" ? undefined : entityType,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [inspecting, setInspecting] = React.useState<AuditLogDto | null>(null);

  const filtered = action !== "" || entityType !== "";

  const columns: readonly Column<AuditLogDto>[] = [
    {
      key: "entity",
      header: "Record",
      cell: (row) => (
        <CellStack
          primary={row.entityType}
          secondary={row.entityId === null ? undefined : row.entityId}
        />
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => <Badge size="sm">{humaniseEnum(row.action)}</Badge>,
    },
    {
      key: "actor",
      header: "By",
      hideBelow: "md",
      cell: (row) => (
        <CellStack
          primary={row.actorName ?? "System"}
          secondary={row.actorRole === null ? undefined : humaniseEnum(row.actorRole)}
        />
      ),
    },
    {
      key: "when",
      header: "When",
      align: "right",
      hideBelow: "lg",
      cell: (row) => (
        <span className="numeric text-xs text-muted">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: "1%",
      cell: (row) => (
        <Button size="sm" variant="ghost" onClick={() => setInspecting(row)}>
          What changed
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader title="Audit log" description="What staff changed, and when." />

      <Panel bodyClassName="p-0">
        <div className="border-b border-border-subtle p-5 sm:p-6">
          <FilterBar
            onClear={
              filtered
                ? () => {
                    setAction("");
                    setEntityType("");
                  }
                : undefined
            }
          >
            <SelectFilter
              label="Action"
              value={action}
              onChange={setAction}
              allLabel="Any action"
              options={Object.values(AuditAction).map((value) => ({
                value,
                label: humaniseEnum(value),
              }))}
            />
            <SelectFilter
              label="Record type"
              value={entityType}
              onChange={setEntityType}
              allLabel="Any record"
              options={(entityTypes.data?.entityTypes ?? []).map((value) => ({
                value,
                label: value,
              }))}
            />
          </FilterBar>
        </div>

        <DataTable
          caption="What staff changed on the platform, and when"
          columns={columns}
          rows={logs.data?.items}
          rowKey={(row) => row.id}
          isPending={logs.isPending}
          isError={logs.isError}
          error={logs.error}
          onRetry={() => void logs.refetch()}
          empty={{
            icon: <ScrollText className="size-6" />,
            title: filtered ? "No entries match those filters" : "Nothing recorded yet",
          }}
          footer={<Pagination meta={logs.data?.meta} onPageChange={setPage} />}
        />
      </Panel>

      <DiffModal entry={inspecting} onClose={() => setInspecting(null)} />
    </div>
  );
}

/** The keys that differ between two plain records, each side's value. */
function diffKeys(
  before: unknown,
  after: unknown,
): Array<{ key: string; before: unknown; after: unknown }> {
  const beforeObj = isRecord(before) ? before : {};
  const afterObj = isRecord(after) ? after : {};
  const keys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);

  return [...keys]
    .filter((key) => JSON.stringify(beforeObj[key]) !== JSON.stringify(afterObj[key]))
    .sort()
    .map((key) => ({ key, before: beforeObj[key], after: afterObj[key] }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function displayValue(value: unknown): string {
  if (value === undefined) return "—";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function DiffModal({ entry, onClose }: { entry: AuditLogDto | null; onClose: () => void }) {
  const diff = entry === null ? [] : diffKeys(entry.before, entry.after);

  return (
    <Modal open={entry !== null} onOpenChange={(open) => !open && onClose()}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>
            {entry === null ? "" : `${humaniseEnum(entry.action)} · ${entry.entityType}`}
          </ModalTitle>
          <ModalDescription>
            {entry === null
              ? null
              : `${entry.actorName ?? "System"} · ${formatDateTime(entry.createdAt)}${
                  hasText(entry.ipAddress) ? ` · ${entry.ipAddress}` : ""
                }`}
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="pb-6">
          {entry !== null && entry.before === null && entry.after !== null && (
            <p className="mb-3 text-xs text-muted">This record was created with these values.</p>
          )}
          {entry !== null && entry.after === null && entry.before !== null && (
            <p className="mb-3 text-xs text-muted">This record was deleted.</p>
          )}

          {diff.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No field-level change recorded.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-xs font-bold tracking-wide text-muted uppercase">
                    <th scope="col" className="px-3 py-2 text-left">
                      Field
                    </th>
                    <th scope="col" className="px-3 py-2 text-left">
                      Before
                    </th>
                    <th scope="col" className="px-3 py-2 text-left">
                      After
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {diff.map((row) => (
                    <tr key={row.key} className="border-b border-border-subtle last:border-0">
                      <td className="px-3 py-2.5 numeric font-semibold text-primary">{row.key}</td>
                      <td className="px-3 py-2.5 text-danger">{displayValue(row.before)}</td>
                      <td className="px-3 py-2.5 text-success">{displayValue(row.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
