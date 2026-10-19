"use client";

import { Bike, ClipboardCheck, FileText, Route, Star } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { PasswordForm } from "@/components/account/password-form";
import { ProfileForm } from "@/components/account/profile-panel";
import { Panel, PortalHeader, StatGrid, StatTile } from "@/components/layout/portal-page";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { ProfileSkeleton, Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { useZones } from "@/hooks/use-geo";
import {
  useDeliveryRates,
  useRiderProfile,
  useSetDeliveryRate,
  useUpdateRiderProfile,
} from "@/hooks/use-riders";
import { ApiError } from "@/lib/api-client";
import { formatDate, formatPrice, hasText } from "@/lib/utils";
import { groupByCity } from "@/types/geo";
import type { DeliveryRatesDto, RiderDto } from "@/types/rider";

const VEHICLE_LABELS: Record<string, string> = {
  MOTORCYCLE: "Motorcycle",
  BICYCLE: "Bicycle",
  CAR: "Car",
  RICKSHAW: "Rickshaw",
  ON_FOOT: "On foot",
};

const DOCUMENT_LABELS: Record<string, string> = {
  CNIC_FRONT: "CNIC — front",
  CNIC_BACK: "CNIC — back",
  DRIVING_LICENSE: "Driving licence",
  VEHICLE_REGISTRATION: "Vehicle registration",
  PROFILE_PHOTO: "Profile photo",
};

/**
 * The rider's own account and rider record, in one place.
 *
 * Deliberately not behind `RiderGate`: an applicant waiting on approval, or one
 * who was turned down, still has a name, a password and bank details to keep
 * right — and this is where they check what the review is waiting on.
 */
export default function RiderProfilePage() {
  const profile = useRiderProfile();

  // A 404 is "signed in as a rider, but never filed the application": the
  // account half of this page still applies, the rider half does not exist yet.
  const notRegistered =
    profile.isError && profile.error instanceof ApiError && profile.error.status === 404;

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="My profile"
        description="Your account, your rider details and where businesses pay your fees."
        action={profile.data !== undefined ? <StatusPill status={profile.data.status} /> : undefined}
      />

      {profile.data !== undefined && <RiderStats rider={profile.data} />}

      {profile.data !== undefined && <DeliveryRates />}

      <Panel title="Account" description="How your name appears to customers and businesses.">
        <ProfileForm />
      </Panel>

      {profile.isPending ? (
        <ProfileSkeleton />
      ) : notRegistered ? (
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
      ) : profile.isError ? (
        <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />
      ) : (
        <>
          {/* Keyed on the rider, so the fields are seeded once from what loaded
              and a later refetch never overwrites what someone is typing. */}
          <RiderDetailsForm key={profile.data.id} rider={profile.data} />
          <Vehicles rider={profile.data} />
          <Documents rider={profile.data} />
        </>
      )}

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

function RiderStats({ rider }: { rider: RiderDto }) {
  return (
    <StatGrid className="xl:grid-cols-3">
      <StatTile
        label="Rating"
        value={rider.rating.toFixed(1)}
        hint={`from ${rider.ratingCount} ${rider.ratingCount === 1 ? "rating" : "ratings"}`}
        icon={<Star className="size-4" />}
        tone="warm"
      />
      <StatTile
        label="Deliveries"
        value={rider.totalDeliveries}
        hint="completed so far"
        icon={<Bike className="size-4" />}
        tone="brand"
      />
      <StatTile
        label="Riding since"
        value={formatDate(rider.verifiedAt ?? rider.createdAt)}
        hint={rider.verifiedAt === null ? "applied — not approved yet" : "approved"}
        icon={<ClipboardCheck className="size-4" />}
        tone="success"
      />
    </StatGrid>
  );
}

/**
 * What a run pays, per kilometre.
 *
 * Every order's delivery fee is priced from these and the rider keeps it, so
 * this is the rider's rate card. The platform sets a standard rate; a rider may
 * set their own, which customers see when they choose a rider at checkout.
 */
function DeliveryRates() {
  const rates = useDeliveryRates();

  return (
    <Panel
      title="Delivery pay"
      description="Customers pay this as the delivery fee, and you keep all of it — plus any tip."
    >
      {rates.isPending ? (
        <Skeleton className="h-24 rounded-[var(--radius-input)]" />
      ) : rates.isError ? (
        <ErrorState density="inline" error={rates.error} onRetry={() => void rates.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-[var(--radius-input)] bg-brand-soft p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-brand">
              <Route aria-hidden className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="numeric font-display text-2xl font-extrabold text-primary">
                {formatPrice(rates.data.perKmFee)} / km
              </span>
              <span className="text-sm text-secondary">
                Measured from the business to the customer.
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Shortest run pays", value: formatPrice(rates.data.minFee) },
              { label: "Longest run pays", value: formatPrice(rates.data.maxFee) },
              { label: "Furthest delivery", value: `${rates.data.maxDistanceKm} km` },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-0.5 rounded-[var(--radius-input)] border border-border-subtle px-4 py-3"
              >
                <dt className="text-xs font-semibold text-muted">{item.label}</dt>
                <dd className="numeric font-bold text-primary">{item.value}</dd>
              </div>
            ))}
          </dl>

          <p className="text-xs text-muted">
            For example, a {Math.min(2, rates.data.maxDistanceKm)} km run pays{" "}
            {formatPrice(
              Math.min(
                Math.max(
                  Math.round(Math.min(2, rates.data.maxDistanceKm) * rates.data.perKmFee),
                  rates.data.minFee,
                ),
                rates.data.maxFee,
              ),
            )}
            {" "}at the standard rate.
          </p>

          <MyRateForm key={rates.data.myPerKmRate ?? "standard"} rates={rates.data} />
        </div>
      )}
    </Panel>
  );
}

/**
 * The rider's own per-km price. Customers see it next to the rider's name at
 * checkout and choose freely between cheaper and dearer riders.
 */
function MyRateForm({ rates }: { rates: DeliveryRatesDto }) {
  const setRate = useSetDeliveryRate();
  const [value, setValue] = React.useState(
    rates.myPerKmRate === null ? "" : String(rates.myPerKmRate),
  );

  const parsed = Number(value);
  const valid =
    value.trim() !== "" &&
    Number.isFinite(parsed) &&
    parsed >= rates.riderRateMin &&
    parsed <= rates.riderRateMax;

  const save = (perKmRate: number | null) =>
    setRate.mutate(
      { perKmRate },
      {
        onSuccess: () =>
          toast.success(
            perKmRate === null
              ? "You're back on the standard rate"
              : `Your rate is now ${formatPrice(perKmRate)} per km`,
          ),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "We couldn't save your rate."),
      },
    );

  return (
    <form
      className="flex flex-col gap-3 border-t border-border-subtle pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) save(parsed);
      }}
    >
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-extrabold text-primary">My rate</h3>
        <p className="text-xs text-muted">
          {rates.myPerKmRate === null
            ? "You charge the standard rate."
            : `You charge ${formatPrice(rates.myPerKmRate)} per km.`}{" "}
          Set your own price and customers see it when they choose a rider. A run costs the shortest-run
          price or more, with no upper cap. Applies to orders placed from now on.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Field
          label="Price per km (PKR)"
          htmlFor="my-rate"
          hint={`Between ${formatPrice(rates.riderRateMin)} and ${formatPrice(rates.riderRateMax)}`}
          className="min-w-48 flex-1"
        >
          <Input
            id="my-rate"
            type="number"
            inputMode="decimal"
            min={rates.riderRateMin}
            max={rates.riderRateMax}
            step="1"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={String(rates.perKmFee)}
          />
        </Field>
        <Button type="submit" loading={setRate.isPending} disabled={!valid}>
          Save rate
        </Button>
        {rates.myPerKmRate !== null && (
          <Button
            type="button"
            variant="ghost"
            disabled={setRate.isPending}
            onClick={() => save(null)}
          >
            Use standard rate
          </Button>
        )}
      </div>
    </form>
  );
}

/** The parts of the rider record a rider owns: licence, home zone, bank details. */
function RiderDetailsForm({ rider }: { rider: RiderDto }) {
  const update = useUpdateRiderProfile();
  const zones = useZones();

  const [licenseNumber, setLicenseNumber] = React.useState(rider.licenseNumber ?? "");
  const [zoneId, setZoneId] = React.useState(rider.zoneId ?? "");
  const [bankName, setBankName] = React.useState(rider.payout?.bankName ?? "");
  const [accountTitle, setAccountTitle] = React.useState(rider.payout?.accountTitle ?? "");
  // The stored number comes back masked, so it is never put in the field: saving
  // the mask back would overwrite the real number with dots.
  const [accountNumber, setAccountNumber] = React.useState("");

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();

        update.mutate(
          {
            licenseNumber: licenseNumber.trim(),
            ...(zoneId !== "" && { zoneId }),
            payout: {
              bankName: bankName.trim(),
              accountTitle: accountTitle.trim(),
              ...(accountNumber.trim() !== "" && { accountNumber: accountNumber.trim() }),
            },
          },
          {
            onSuccess: () => {
              toast.success("Rider details saved");
              setAccountNumber("");
            },
            onError: (error) =>
              toast.error(
                error instanceof ApiError ? error.message : "We couldn't save your rider details.",
              ),
          },
        );
      }}
    >
      <Panel title="Rider details" description={rider.statusText}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="CNIC"
            htmlFor="rider-cnic"
            hint="Your approval was made against this, so it can't be changed here."
          >
            <Input id="rider-cnic" value={rider.cnic} disabled className="numeric" />
          </Field>

          <Field label="Driving licence number" htmlFor="rider-licence">
            <Input
              id="rider-licence"
              value={licenseNumber}
              onChange={(event) => setLicenseNumber(event.target.value)}
              maxLength={40}
            />
          </Field>

          <Field
            label="Where you're based"
            htmlFor="rider-zone"
            hint="Dispatch offers you runs in your own zone first."
          >
            {zones.isPending ? (
              <Skeleton className="h-12 rounded-[var(--radius-input)]" />
            ) : (
              <NativeSelect
                id="rider-zone"
                value={zoneId}
                onChange={(event) => setZoneId(event.target.value)}
              >
                {rider.zoneId === null && <option value="">No preference</option>}
                {groupByCity(zones.data ?? []).map(({ city, zones: cityZones }) => (
                  <optgroup key={city.id} label={city.name}>
                    {cityZones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </NativeSelect>
            )}
          </Field>
        </div>
      </Panel>

      <Panel
        title="Bank details"
        description="Where a business can send the delivery fees it owes you."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank or wallet" htmlFor="rider-bank">
            <Input
              id="rider-bank"
              value={bankName}
              onChange={(event) => setBankName(event.target.value)}
              placeholder="Meezan Bank, JazzCash…"
              maxLength={120}
            />
          </Field>

          <Field
            label="Account title"
            htmlFor="rider-account-title"
            hint="The name the account is held in."
          >
            <Input
              id="rider-account-title"
              value={accountTitle}
              onChange={(event) => setAccountTitle(event.target.value)}
              maxLength={120}
            />
          </Field>

          <Field
            label="Account number"
            htmlFor="rider-account-number"
            hint={
              hasText(rider.payout?.accountNumber)
                ? `On file: ${rider.payout.accountNumber}. Leave blank to keep it.`
                : "Account number, IBAN or wallet number."
            }
          >
            <Input
              id="rider-account-number"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              className="numeric"
              maxLength={40}
            />
          </Field>
        </div>
      </Panel>

      <Button type="submit" size="lg" loading={update.isPending} className="self-start">
        Save rider details
      </Button>
    </form>
  );
}

function Vehicles({ rider }: { rider: RiderDto }) {
  const vehicles = rider.vehicles.filter((vehicle) => vehicle.isActive);

  return (
    <Panel
      title="Vehicle"
      description="What you registered to deliver with. Support can change it for you."
      bodyClassName="p-0"
    >
      {vehicles.length === 0 ? (
        <EmptyState
          density="inline"
          icon={<Bike className="size-6" />}
          title="No vehicle on file"
          description="Contact support to add the vehicle you deliver with."
        />
      ) : (
        <ul className="divide-y divide-border-subtle">
          {vehicles.map((vehicle) => {
            const model = [vehicle.make, vehicle.model, vehicle.year, vehicle.color]
              .filter((part) => part !== null && part !== "")
              .join(" · ");

            return (
              <li
                key={vehicle.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-semibold text-primary">
                    {VEHICLE_LABELS[vehicle.type] ?? vehicle.type}
                  </span>
                  {model !== "" && <span className="text-sm text-secondary">{model}</span>}
                </div>
                {hasText(vehicle.plateNumber) && (
                  <span className="numeric rounded-full bg-surface-muted px-3 py-1 text-sm font-bold text-primary">
                    {vehicle.plateNumber}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function Documents({ rider }: { rider: RiderDto }) {
  return (
    <Panel
      title="Documents"
      description="What you've uploaded, and where each one is in review."
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/rider/onboarding">Upload or replace</Link>
        </Button>
      }
      bodyClassName="p-0"
    >
      {rider.documents.length === 0 ? (
        <EmptyState
          density="inline"
          icon={<FileText className="size-6" />}
          title="Nothing uploaded yet"
          description="Your application can't be approved until your documents are in."
        />
      ) : (
        <ul className="divide-y divide-border-subtle">
          {rider.documents.map((document) => (
            <li
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-semibold text-primary">
                  {DOCUMENT_LABELS[document.type] ?? document.type}
                </span>
                {document.expiresAt !== null && (
                  <span
                    className={
                      document.isExpired ? "text-xs font-semibold text-danger" : "text-xs text-muted"
                    }
                  >
                    {document.isExpired ? "Expired" : "Expires"} {formatDate(document.expiresAt)}
                  </span>
                )}
                {hasText(document.rejectionReason) && (
                  <span className="text-xs font-medium text-danger">
                    {document.rejectionReason}
                  </span>
                )}
              </div>
              <StatusPill status={document.status} size="sm" />
            </li>
          ))}
        </ul>
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
