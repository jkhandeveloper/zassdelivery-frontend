"use client";

import { Check, Home, MapPin, Plus, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { NewAddressForm } from "@/components/account/address-form";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ProfileSkeleton, Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Badge } from "@/components/ui/status-pill";
import {
  useAddresses,
  useProfile,
  useSetDefaultAddress,
  useUpdateProfile,
} from "@/hooks/use-users";
import { Media } from "@/components/ui/media";
import { ApiError } from "@/lib/api-client";
import { cn, formatLandmark, hasText } from "@/lib/utils";
import type { UserDto } from "@/types/user";

function Panel({
  title,
  description,
  id,
  action,
  children,
}: {
  title: string;
  description?: string;
  id?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="flex flex-col gap-5 rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-5 shadow-card sm:p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-xl font-extrabold text-primary">{title}</h2>
          {description !== undefined && <p className="text-sm text-secondary">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Name, email and the phone the account is keyed on. */
function ProfileForm() {
  const profile = useProfile();

  if (profile.isPending) {
    return <ProfileSkeleton />;
  }

  if (profile.isError) {
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  }

  // Keyed on the account, so the fields are seeded once from what loaded and a
  // later refetch never overwrites what someone is in the middle of typing.
  return <ProfileFields key={profile.data.id} user={profile.data} />;
}

function ProfileFields({ user }: { user: UserDto }) {
  const update = useUpdateProfile();
  const { refreshUser } = useAuth();

  const [fullName, setFullName] = React.useState(user.fullName);
  const [email, setEmail] = React.useState(user.email ?? "");

  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        update.mutate(
          {
            fullName: fullName.trim(),
            ...(email.trim() !== "" && { email: email.trim() }),
          },
          {
            onSuccess: () => {
              toast.success("Profile updated");
              // The header reads the session user, not this query.
              void refreshUser();
            },
            onError: (error) =>
              toast.error(
                error instanceof ApiError ? error.message : "We couldn't save your profile.",
              ),
          },
        );
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-center gap-5">
        <span className="gradient-brand grid size-20 shrink-0 place-items-center overflow-hidden rounded-full font-display text-2xl font-extrabold text-white shadow-card dark:text-[#04202b]">
          {hasText(user.avatarUrl) ? (
            <Media src={user.avatarUrl} className="rounded-full" />
          ) : initials === "" ? (
            <UserRound className="size-8" />
          ) : (
            initials
          )}
        </span>

        <div className="flex flex-col gap-1">
          <p className="font-display text-lg font-extrabold text-primary">{user.fullName}</p>
          <p className="numeric text-sm text-muted">{user.phone}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge size="sm" variant={user.isPhoneVerified ? "soft" : "outline"}>
              {user.isPhoneVerified ? "Phone verified" : "Phone unverified"}
            </Badge>
            <Badge size="sm" variant="outline">
              Member since {new Date(user.createdAt).getFullYear()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="profile-name" required>
          <Input
            id="profile-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </Field>

        <Field label="Email" htmlFor="profile-email" hint="Used for receipts and order updates.">
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field
          label="Phone number"
          htmlFor="profile-phone"
          hint="Your phone is your sign-in — contact support to change it."
        >
          <Input id="profile-phone" value={user.phone} disabled className="numeric" />
        </Field>
      </div>

      <Button type="submit" size="lg" loading={update.isPending} className="self-start">
        Update profile
      </Button>
    </form>
  );
}

/** Saved delivery addresses, with the default the cart falls back to. */
function AddressBook() {
  const addresses = useAddresses({ limit: 20 });
  const setDefault = useSetDefaultAddress();
  const [adding, setAdding] = React.useState(false);

  const items = addresses.data?.items ?? [];

  return (
    <Panel
      id="addresses"
      title="Delivery addresses"
      description="The address your cart uses by default, and everywhere else you order to."
      action={
        !adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Add address
          </Button>
        )
      }
    >
      {adding && <NewAddressForm onCancel={() => setAdding(false)} onDone={() => setAdding(false)} />}

      {addresses.isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-[var(--radius-input)]" />
          ))}
        </div>
      ) : addresses.isError ? (
        <ErrorState
          density="inline"
          error={addresses.error}
          onRetry={() => void addresses.refetch()}
        />
      ) : items.length === 0 ? (
        !adding && (
          <EmptyState
            density="inline"
            icon={<MapPin className="size-6" />}
            title="No saved addresses"
            description="Add one and it will be waiting at checkout."
            action={
              <Button variant="outline" onClick={() => setAdding(true)}>
                Add an address
              </Button>
            }
          />
        )
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((address) => (
            <li
              key={address.id}
              className={cn(
                "flex flex-wrap items-start gap-3 rounded-[var(--radius-input)] border p-4",
                address.isDefault ? "border-brand bg-brand-soft" : "border-border-default",
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-brand">
                {address.label === "HOME" ? (
                  <Home aria-hidden className="size-4" />
                ) : (
                  <MapPin aria-hidden className="size-4" />
                )}
              </span>

              <div className="flex min-w-[12rem] flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-bold capitalize text-primary">
                  {address.label === null ? "Address" : address.label.toLowerCase()}
                  {address.isDefault && (
                    <Badge size="sm" variant="soft">
                      Default
                    </Badge>
                  )}
                </span>
                <span className="text-sm text-secondary">{address.line1}</span>
                {hasText(address.landmark) && (
                  <span className="text-xs text-muted">{formatLandmark(address.landmark)}</span>
                )}
                {!address.isDeliverable && (
                  <span className="text-xs font-semibold text-warning">
                    We don&apos;t deliver here yet.
                  </span>
                )}
              </div>

              {!address.isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={setDefault.isPending && setDefault.variables === address.id}
                  onClick={() =>
                    setDefault.mutate(address.id, {
                      onSuccess: () => toast.success("Default address updated"),
                      onError: () => toast.error("We couldn't update your default address."),
                    })
                  }
                >
                  <Check className="size-4" />
                  Make default
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function ProfilePanel() {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return <ProfileSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={<UserRound className="size-8" />}
        title="Sign in to see your profile"
        description="Your details, saved addresses and preferences live on your account."
        action={
          <Button asChild>
            <Link href="/login?next=%2Fprofile">Sign in</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="Profile information"
        description="How your name appears to riders and restaurants."
      >
        <ProfileForm />
      </Panel>

      <AddressBook />

      <Panel
        title="Danger zone"
        description="Signing out here ends this session only — other devices stay signed in."
      >
        <SignOutRow />
      </Panel>
    </div>
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
        <Trash2 className="size-4" />
        Sign out everywhere
      </Button>
    </div>
  );
}
