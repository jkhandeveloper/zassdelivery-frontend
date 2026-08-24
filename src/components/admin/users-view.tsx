"use client";

import { Ban, RotateCcw, ShieldCheck, Trash2, UserPlus, UsersRound } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  CellStack,
  DataTable,
  Pagination,
  RowActions,
  type Column,
} from "@/components/admin/data-table";
import {
  FilterBar,
  humaniseEnum,
  SearchInput,
  SelectFilter,
} from "@/components/admin/filter-bar";
import { ConfirmDialog, ReasonDialog } from "@/components/admin/reason-dialog";
import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { StatusPill } from "@/components/ui/status-pill";
import {
  useAdminUsers,
  useChangeUserStatus,
  useCreateUser,
  useDeleteUser,
  useRestoreUser,
} from "@/hooks/use-admin";
import { useValueChanged } from "@/hooks/use-value-changed";
import { ApiError } from "@/lib/api-client";
import { formatDate, formatRelative, hasText } from "@/lib/utils";
import { UserRole, UserStatus } from "@/types/auth";
import type { UserDto } from "@/types/user";

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "Customer",
  RIDER: "Rider",
  VENDOR_OWNER: "Vendor owner",
  VENDOR_STAFF: "Vendor staff",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

/**
 * Every account, with role and status changes.
 *
 * Deletion here is the API's soft delete — the row stays, marked, and can be
 * restored. The screen says so rather than implying the account is gone, and
 * keeps deleted accounts behind a filter so the default list is the live one.
 */
export function AdminUsersView() {
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState<UserRole | "">("");
  const [status, setStatus] = React.useState<UserStatus | "">("");
  const [includeDeleted, setIncludeDeleted] = React.useState(false);
  const [page, setPage] = React.useState(1);

  if (useValueChanged(`${search}|${role}|${status}|${includeDeleted}`) && page !== 1) {
    setPage(1);
  }

  const users = useAdminUsers({
    page,
    limit: 20,
    search: search === "" ? undefined : search,
    role: role === "" ? undefined : role,
    status: status === "" ? undefined : status,
    includeDeleted: includeDeleted ? true : undefined,
  });

  const changeStatus = useChangeUserStatus();
  const deleteUser = useDeleteUser();
  const restoreUser = useRestoreUser();

  const [suspending, setSuspending] = React.useState<UserDto | null>(null);
  const [banning, setBanning] = React.useState<UserDto | null>(null);
  const [deleting, setDeleting] = React.useState<UserDto | null>(null);
  const [creating, setCreating] = React.useState(false);

  const filtered = search !== "" || role !== "" || status !== "" || includeDeleted;

  const columns: readonly Column<UserDto>[] = [
    {
      key: "user",
      header: "Account",
      cell: (row) => (
        <CellStack
          primary={
            <span className="flex items-center gap-2">
              {row.fullName}
              {hasText(row.deletedAt) && (
                <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-bold text-danger">
                  DELETED
                </span>
              )}
            </span>
          }
          secondary={hasText(row.email) ? `${row.phone} · ${row.email}` : row.phone}
        />
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => <span className="text-secondary">{ROLE_LABELS[row.role] ?? row.role}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusPill status={row.status} size="sm" />,
    },
    {
      key: "verified",
      header: "Phone",
      hideBelow: "xl",
      cell: (row) => (
        <span className={row.isPhoneVerified ? "text-xs text-success" : "text-xs text-warning"}>
          {row.isPhoneVerified ? "Verified" : "Unverified"}
        </span>
      ),
    },
    {
      key: "lastLogin",
      header: "Last seen",
      align: "right",
      hideBelow: "lg",
      cell: (row) => (
        <span className="numeric text-xs text-muted">
          {row.lastLoginAt === null ? "Never" : formatRelative(row.lastLoginAt)}
        </span>
      ),
    },
    {
      key: "created",
      header: "Joined",
      align: "right",
      hideBelow: "md",
      cell: (row) => <span className="numeric text-xs text-muted">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: "1%",
      cell: (row) => (
        <RowActions>
          {hasText(row.deletedAt) ? (
            <Button
              size="sm"
              variant="outline"
              loading={restoreUser.isPending}
              onClick={() => restoreUser.mutate(row.id)}
            >
              <RotateCcw className="size-4" />
              Restore
            </Button>
          ) : (
            <>
              {row.status === UserStatus.ACTIVE ? (
                <Button size="sm" variant="outline" onClick={() => setSuspending(row)}>
                  Suspend
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  loading={changeStatus.isPending}
                  onClick={() =>
                    changeStatus.mutate({
                      id: row.id,
                      data: { status: UserStatus.ACTIVE, reason: "Reinstated by admin" },
                    })
                  }
                >
                  <ShieldCheck className="size-4" />
                  Activate
                </Button>
              )}

              {row.status !== UserStatus.BANNED && (
                <Button size="sm" variant="ghost" onClick={() => setBanning(row)}>
                  <Ban className="size-4" />
                  <span className="sr-only">Ban {row.fullName}</span>
                </Button>
              )}

              <Button size="sm" variant="ghost" onClick={() => setDeleting(row)}>
                <Trash2 className="size-4 text-danger" />
                <span className="sr-only">Delete {row.fullName}</span>
              </Button>
            </>
          )}
        </RowActions>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Users"
        description="Every account, with role and status changes."
        action={
          <Button onClick={() => setCreating(true)}>
            <UserPlus className="size-4" />
            New account
          </Button>
        }
      />

      <Panel bodyClassName="p-0">
        <div className="border-b border-border-subtle p-5 sm:p-6">
          <FilterBar
            onClear={
              filtered
                ? () => {
                    setSearch("");
                    setRole("");
                    setStatus("");
                    setIncludeDeleted(false);
                  }
                : undefined
            }
          >
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name or phone" />
            <SelectFilter
              label="Role"
              value={role}
              onChange={setRole}
              allLabel="Any role"
              options={Object.values(UserRole).map((value) => ({
                value,
                label: ROLE_LABELS[value] ?? value,
              }))}
            />
            <SelectFilter
              label="Status"
              value={status}
              onChange={setStatus}
              allLabel="Any status"
              options={Object.values(UserStatus).map((value) => ({
                value,
                label:
                  value === UserStatus.PENDING_VERIFICATION ? "Unverified" : humaniseEnum(value),
              }))}
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(event) => setIncludeDeleted(event.target.checked)}
                className="size-4 accent-[var(--brand)]"
              />
              Include deleted
            </label>
          </FilterBar>
        </div>

        <DataTable
          caption="User accounts, with role and status"
          columns={columns}
          rows={users.data?.items}
          rowKey={(row) => row.id}
          isPending={users.isPending}
          isError={users.isError}
          error={users.error}
          onRetry={() => void users.refetch()}
          empty={{
            icon: <UsersRound className="size-6" />,
            title: filtered ? "No accounts match those filters" : "No accounts yet",
            description: filtered ? "Try a wider search, or clear the filters." : undefined,
          }}
          footer={<Pagination meta={users.data?.meta} onPageChange={setPage} />}
        />
      </Panel>

      <CreateUserModal open={creating} onOpenChange={setCreating} />

      <ReasonDialog
        open={suspending !== null}
        onOpenChange={(open) => !open && setSuspending(null)}
        title={`Suspend ${suspending?.fullName ?? ""}?`}
        description="They stay signed out until the account is activated again."
        confirmLabel="Suspend account"
        pending={changeStatus.isPending}
        successMessage="Account suspended."
        onConfirm={({ reason }) =>
          changeStatus.mutateAsync({
            id: suspending?.id ?? "",
            data: { status: UserStatus.SUSPENDED, reason },
          })
        }
      />

      <ReasonDialog
        open={banning !== null}
        onOpenChange={(open) => !open && setBanning(null)}
        title={`Ban ${banning?.fullName ?? ""}?`}
        description="A ban is the permanent form of a suspension. Use it for fraud and abuse, not for a dispute."
        confirmLabel="Ban account"
        pending={changeStatus.isPending}
        successMessage="Account banned."
        onConfirm={({ reason }) =>
          changeStatus.mutateAsync({
            id: banning?.id ?? "",
            data: { status: UserStatus.BANNED, reason },
          })
        }
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.fullName ?? ""}?`}
        description="This is a soft delete: the account is hidden and cannot sign in, and their order history is kept. You can restore it from the “Include deleted” filter."
        confirmLabel="Delete account"
        variant="danger"
        pending={deleteUser.isPending}
        successMessage="Account deleted. It can still be restored."
        onConfirm={() => deleteUser.mutateAsync(deleting?.id ?? "")}
      />
    </div>
  );
}

/**
 * Creating a staff account by hand.
 *
 * The only accounts anyone creates from here are staff ones — customers, riders
 * and vendors all register themselves — so the role defaults to the one an
 * operator is actually reaching for, and the password field explains why it is
 * optional.
 */
function CreateUserModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createUser = useCreateUser();

  const [phone, setPhone] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<UserRole>(UserRole.ADMIN);
  const [error, setError] = React.useState<string | null>(null);

  if (useValueChanged(open) && open) {
    setPhone("");
    setFullName("");
    setEmail("");
    setPassword("");
    setRole(UserRole.ADMIN);
    setError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await createUser.mutateAsync({
        phone: phone.trim(),
        fullName: fullName.trim(),
        role,
        email: hasText(email) ? email.trim() : undefined,
        password: hasText(password) ? password : undefined,
      });
      toast.success(`${fullName.trim()} can now sign in.`);
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That did not go through.");
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <form onSubmit={submit}>
          <ModalHeader>
            <ModalTitle>New account</ModalTitle>
            <ModalDescription>
              For staff. Customers, riders and vendors sign themselves up.
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="flex flex-col gap-4">
            <Field label="Full name" htmlFor="new-user-name" required>
              <Input
                id="new-user-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Operations Admin"
                required
              />
            </Field>

            <Field
              label="Phone"
              htmlFor="new-user-phone"
              required
              hint="With the country code — +923001234567."
            >
              <Input
                id="new-user-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+923001234567"
                required
              />
            </Field>

            <Field label="Role" htmlFor="new-user-role" required>
              <NativeSelect
                id="new-user-role"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
              >
                {Object.values(UserRole).map((value) => (
                  <option key={value} value={value}>
                    {ROLE_LABELS[value] ?? value}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="Email" htmlFor="new-user-email" hint="Optional.">
              <Input
                id="new-user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ops@zassdelivery.pk"
              />
            </Field>

            <Field
              label="Password"
              htmlFor="new-user-password"
              hint="Leave blank and they set one themselves on first sign-in."
              error={error ?? undefined}
            >
              <Input
                id="new-user-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createUser.isPending}>
              Create account
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
