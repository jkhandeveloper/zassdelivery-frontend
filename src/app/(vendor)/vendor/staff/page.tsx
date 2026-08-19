"use client";

import { UserPlus, UsersRound } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { VendorGate } from "@/components/vendor/vendor-gate";
import { useAddStaff, useRestaurantStaff } from "@/hooks/use-vendor";
import { ApiError } from "@/lib/api-client";
import { formatDate, hasText } from "@/lib/utils";
import { UserRole } from "@/types/auth";

export default function VendorStaffPage() {
  return (
    <VendorGate allowUnapproved>{(restaurant) => <Staff restaurantId={restaurant.id} />}</VendorGate>
  );
}

function Staff({ restaurantId }: { restaurantId: string }) {
  const { user } = useAuth();
  const staff = useRestaurantStaff(restaurantId);
  const add = useAddStaff(restaurantId);

  const [adding, setAdding] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Staff accounts are created by the owner, not by an administrator — but a
  // member of staff cannot create more of themselves.
  const isOwner = user?.role === UserRole.VENDOR_OWNER;
  const canSubmit =
    fullName.trim() !== "" && phone.trim() !== "" && password.length >= 8;

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Staff"
        description="Kitchen accounts that can work the order queue and the menu, scoped to this restaurant."
        action={
          isOwner &&
          !adding && (
            <Button onClick={() => setAdding(true)}>
              <UserPlus className="size-4" />
              Add staff
            </Button>
          )
        }
      />

      {adding && (
        <Panel
          title="Create a staff account"
          description="They sign in with this phone number and password. Ask them to change it."
        >
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canSubmit) return;

              add.mutate(
                {
                  fullName: fullName.trim(),
                  phone: phone.trim(),
                  password,
                  ...(email.trim() !== "" && { email: email.trim() }),
                },
                {
                  onSuccess: (member) => {
                    toast.success(`${member.fullName} can now sign in`);
                    setAdding(false);
                    setFullName("");
                    setPhone("");
                    setEmail("");
                    setPassword("");
                  },
                  onError: (error) =>
                    toast.error(
                      error instanceof ApiError
                        ? error.message
                        : "We couldn't create that account.",
                    ),
                },
              );
            }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="staff-name" required>
                <Input
                  id="staff-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Bilal Ahmed"
                  required
                />
              </Field>

              <Field label="Phone" htmlFor="staff-phone" required hint="This is their sign-in.">
                <Input
                  id="staff-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="03001234567"
                  required
                />
              </Field>

              <Field label="Email" htmlFor="staff-email" hint="Optional.">
                <Input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="bilal@example.com"
                />
              </Field>

              <Field
                label="Temporary password"
                htmlFor="staff-password"
                required
                hint="At least 8 characters."
                error={
                  password !== "" && password.length < 8
                    ? "Too short — use at least 8 characters."
                    : undefined
                }
              >
                <Input
                  id="staff-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  invalid={password !== "" && password.length < 8}
                  required
                />
              </Field>
            </div>

            <div className="flex gap-2">
              <Button type="submit" loading={add.isPending} disabled={!canSubmit}>
                Create account
              </Button>
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel title="Your team" bodyClassName="p-0">
        {staff.isPending ? (
          <div className="p-5 sm:p-6">
            <ListSkeleton label="Loading staff" count={3} />
          </div>
        ) : staff.isError ? (
          <ErrorState density="inline" error={staff.error} onRetry={() => void staff.refetch()} />
        ) : staff.data.length === 0 ? (
          <EmptyState
            density="inline"
            icon={<UsersRound className="size-6" />}
            title="No staff yet"
            description={
              isOwner
                ? "Add kitchen accounts so your team can work the order queue without your login."
                : "Only the owner can add staff accounts."
            }
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {staff.data.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand"
                  >
                    {member.fullName
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part.charAt(0).toUpperCase())
                      .join("")}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-bold text-primary">{member.fullName}</span>
                    <span className="numeric truncate text-xs text-muted">
                      {member.phone}
                      {hasText(member.email) && <> · {member.email}</>}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted">
                    Added {formatDate(member.createdAt)}
                  </span>
                  <StatusPill status={member.status} size="sm" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
