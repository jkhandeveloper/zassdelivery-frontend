"use client";

import { Bike, CheckCircle2, Upload } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { useZones } from "@/hooks/use-geo";
import {
  useRegisterRider,
  useRiderDocuments,
  useRiderProfile,
  useUploadRiderDocument,
} from "@/hooks/use-riders";
import { ApiError } from "@/lib/api-client";
import { groupByCity } from "@/types/geo";
import { DriverDocumentType, VehicleType } from "@/types/enums";
import type { RiderDto } from "@/types/rider";

const VEHICLES: Array<{ value: VehicleType; label: string }> = [
  { value: VehicleType.MOTORCYCLE, label: "Motorcycle" },
  { value: VehicleType.BICYCLE, label: "Bicycle" },
  { value: VehicleType.CAR, label: "Car" },
  { value: VehicleType.RICKSHAW, label: "Rickshaw" },
  { value: VehicleType.ON_FOOT, label: "On foot" },
];

const DOCUMENTS: Array<{ value: DriverDocumentType; label: string; hint: string }> = [
  { value: DriverDocumentType.CNIC_FRONT, label: "CNIC — front", hint: "The photo side." },
  { value: DriverDocumentType.CNIC_BACK, label: "CNIC — back", hint: "The address side." },
  {
    value: DriverDocumentType.DRIVING_LICENSE,
    label: "Driving licence",
    hint: "Needed for a motorcycle, car or rickshaw.",
  },
  {
    value: DriverDocumentType.VEHICLE_REGISTRATION,
    label: "Vehicle registration",
    hint: "The registration book for your vehicle.",
  },
  { value: DriverDocumentType.PROFILE_PHOTO, label: "Profile photo", hint: "A clear head shot." },
];

/**
 * Sign up to deliver.
 *
 * Two steps, because the API has two: `POST /riders/register` files the
 * application, then `PUT /riders/me/documents` attaches each document. An
 * administrator verifies the documents and approves the rider — the rider files
 * it themselves, staff only decide on it.
 *
 * Public by design: someone signing up to *become* a rider does not hold the
 * RIDER role yet, so a guarded page would be unreachable by the people it is for.
 */
export default function RiderOnboardingPage() {
  const { user, isReady, isAuthenticated } = useAuth();
  const profile = useRiderProfile(isReady && isAuthenticated);

  const notRegistered =
    profile.isError && profile.error instanceof ApiError && profile.error.status === 404;

  return (
    <div className="container-zass py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Deliver with ZassDelivery" }]}
      />

      <header className="mb-8 mt-4 flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl">Deliver with ZassDelivery</h1>
        <p className="max-w-2xl text-secondary">
          Sign up, upload your documents, and start taking runs once you&apos;re approved. You
          choose your own hours.
        </p>
      </header>

      {!isReady || (isAuthenticated && profile.isPending) ? (
        <Skeleton className="h-96 max-w-3xl rounded-[var(--radius-panel)]" />
      ) : !isAuthenticated ? (
        <EmptyState
          icon={<Bike className="size-8" />}
          title="Create a rider account first"
          description="Sign up as a rider, then come straight back here to file your application."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/register?next=%2Frider%2Fonboarding">Create an account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login?next=%2Frider%2Fonboarding">Sign in</Link>
              </Button>
            </div>
          }
        />
      ) : user?.role !== "RIDER" ? (
        <EmptyState
          icon={<Bike className="size-8" />}
          title="This needs a rider account"
          description={`You're signed in as a ${user?.role.toLowerCase().replace(/_/g, " ")}. Delivering needs a rider account — sign up as one, or ask support to change your role.`}
          action={
            <Button asChild variant="outline">
              <Link href="/support">Contact support</Link>
            </Button>
          }
        />
      ) : notRegistered ? (
        <ApplicationForm />
      ) : profile.data === undefined ? (
        <EmptyState
          icon={<Bike className="size-8" />}
          title="We couldn't load your application"
          description="Something went wrong reading your rider profile."
          action={<Button onClick={() => void profile.refetch()}>Try again</Button>}
        />
      ) : (
        <DocumentsStep rider={profile.data} />
      )}
    </div>
  );
}

function ApplicationForm() {
  const register = useRegisterRider();
  const zones = useZones();

  const [cnic, setCnic] = React.useState("");
  const [licenseNumber, setLicenseNumber] = React.useState("");
  const [zoneId, setZoneId] = React.useState("");
  const [vehicleType, setVehicleType] = React.useState<VehicleType>(VehicleType.MOTORCYCLE);
  const [make, setMake] = React.useState("");
  const [model, setModel] = React.useState("");
  const [plateNumber, setPlateNumber] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [accountTitle, setAccountTitle] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");

  // A motorised vehicle needs a plate and a licence before approval; on foot or
  // by bicycle neither exists to give.
  const motorised =
    vehicleType !== VehicleType.ON_FOOT && vehicleType !== VehicleType.BICYCLE;

  const cnicDigits = cnic.replace(/\D/g, "");
  const validCnic = /^\d{13}$/.test(cnicDigits);

  return (
    <form
      className="flex max-w-3xl flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!validCnic) return;

        register.mutate(
          {
            cnic: cnicDigits,
            ...(licenseNumber.trim() !== "" && { licenseNumber: licenseNumber.trim() }),
            ...(zoneId !== "" && { zoneId }),
            vehicle: {
              type: vehicleType,
              ...(make.trim() !== "" && { make: make.trim() }),
              ...(model.trim() !== "" && { model: model.trim() }),
              ...(plateNumber.trim() !== "" && { plateNumber: plateNumber.trim() }),
            },
            ...((bankName.trim() !== "" ||
              accountTitle.trim() !== "" ||
              accountNumber.trim() !== "") && {
              payout: {
                ...(bankName.trim() !== "" && { bankName: bankName.trim() }),
                ...(accountTitle.trim() !== "" && { accountTitle: accountTitle.trim() }),
                ...(accountNumber.trim() !== "" && { accountNumber: accountNumber.trim() }),
              },
            }),
          },
          {
            onSuccess: () => toast.success("Application filed — now add your documents"),
            onError: (error) =>
              toast.error(
                error instanceof ApiError ? error.message : "We couldn't file your application.",
              ),
          },
        );
      }}
    >
      <Section title="About you">
        <Field
          label="CNIC"
          htmlFor="rider-cnic"
          required
          hint="13 digits. Dashes are fine — we strip them."
          error={cnic !== "" && !validCnic ? "A CNIC is 13 digits." : undefined}
        >
          <Input
            id="rider-cnic"
            value={cnic}
            onChange={(event) => setCnic(event.target.value)}
            placeholder="17101-1234567-8"
            inputMode="numeric"
            className="numeric"
            invalid={cnic !== "" && !validCnic}
            required
          />
        </Field>

        <Field
          label="Where you'll be based"
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
              <option value="">No preference</option>
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
      </Section>

      <Section title="Your vehicle">
        <Field label="What you'll ride" htmlFor="rider-vehicle" required>
          <NativeSelect
            id="rider-vehicle"
            value={vehicleType}
            onChange={(event) => setVehicleType(event.target.value as VehicleType)}
          >
            {VEHICLES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </Field>

        {motorised && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Make" htmlFor="rider-make">
                <Input
                  id="rider-make"
                  value={make}
                  onChange={(event) => setMake(event.target.value)}
                  placeholder="Honda"
                />
              </Field>
              <Field label="Model" htmlFor="rider-model">
                <Input
                  id="rider-model"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder="CD 70"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Number plate" htmlFor="rider-plate">
                <Input
                  id="rider-plate"
                  value={plateNumber}
                  onChange={(event) => setPlateNumber(event.target.value.toUpperCase())}
                  placeholder="PES-1234"
                  className="numeric"
                />
              </Field>
              <Field
                label="Licence number"
                htmlFor="rider-license"
                hint="Needed before you can be approved."
              >
                <Input
                  id="rider-license"
                  value={licenseNumber}
                  onChange={(event) => setLicenseNumber(event.target.value)}
                  placeholder="KPK-2019-887766"
                />
              </Field>
            </div>
          </>
        )}
      </Section>

      <Section
        title="Where we pay you"
        description="You can add this later, but withdrawals are blocked until you do."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Bank" htmlFor="rider-bank">
            <Input
              id="rider-bank"
              value={bankName}
              onChange={(event) => setBankName(event.target.value)}
              placeholder="Meezan Bank"
            />
          </Field>
          <Field
            label="Account title"
            htmlFor="rider-account-title"
            hint="Transfers fail when this doesn't match."
          >
            <Input
              id="rider-account-title"
              value={accountTitle}
              onChange={(event) => setAccountTitle(event.target.value)}
              placeholder="Ahmad Khan"
            />
          </Field>
          <Field label="Account number" htmlFor="rider-account-number" className="sm:col-span-2">
            <Input
              id="rider-account-number"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              placeholder="PK00MEZN0000000000000000"
              className="numeric"
            />
          </Field>
        </div>
      </Section>

      <Button
        type="submit"
        size="lg"
        className="self-start"
        loading={register.isPending}
        disabled={!validCnic}
      >
        File my application
      </Button>
    </form>
  );
}

function DocumentsStep({ rider }: { rider: RiderDto }) {
  const documents = useRiderDocuments();
  const upload = useUploadRiderDocument();

  const byType = new Map((documents.data ?? []).map((entry) => [entry.type, entry]));
  const outstanding = new Set<string>(rider.missingDocuments);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-1">
          <p className="font-display text-lg font-extrabold text-primary">
            Your application is filed
          </p>
          <p className="text-sm text-secondary">{rider.statusText}</p>
        </div>
        <StatusPill status={rider.status} />
      </div>

      {rider.missingDocuments.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="size-8 text-success" />}
          title="Everything's in"
          description="All the documents we need have been verified. An administrator makes the final call — you'll see it on your dashboard."
          action={
            <Button asChild>
              <Link href="/rider">Go to my dashboard</Link>
            </Button>
          }
        />
      ) : (
        <Section
          title="Upload your documents"
          description="Paste the address of each scan or photo you've uploaded. An administrator verifies them before your application can be approved."
        >
          <ul className="flex flex-col gap-4">
            {DOCUMENTS.map((document) => {
              const existing = byType.get(document.value);
              const required = outstanding.has(document.value);

              // Only what the API says is still outstanding, plus anything
              // already uploaded — a bicycle rider is never asked for a licence.
              if (!required && existing === undefined) return null;

              return (
                <li
                  key={document.value}
                  className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border-subtle p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-primary">{document.label}</span>
                      <span className="text-xs text-muted">{document.hint}</span>
                    </div>
                    {existing !== undefined && (
                      <StatusPill status={existing.status} size="sm" />
                    )}
                  </div>

                  {existing?.rejectionReason != null && (
                    <p className="rounded-[var(--radius-input)] bg-danger-soft px-3.5 py-2 text-xs font-medium text-danger">
                      {existing.rejectionReason}
                    </p>
                  )}

                  <DocumentUpload
                    type={document.value}
                    hasExisting={existing !== undefined}
                    pending={upload.isPending}
                    onSubmit={(fileUrl, number) =>
                      upload.mutate(
                        {
                          type: document.value,
                          fileUrl,
                          ...(number !== "" && { number }),
                        },
                        {
                          onSuccess: () => toast.success(`${document.label} uploaded`),
                          onError: (error) =>
                            toast.error(
                              error instanceof ApiError
                                ? error.message
                                : "We couldn't upload that document.",
                            ),
                        },
                      )
                    }
                  />
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </div>
  );
}

function DocumentUpload({
  type,
  hasExisting,
  pending,
  onSubmit,
}: {
  type: string;
  hasExisting: boolean;
  pending: boolean;
  onSubmit: (fileUrl: string, number: string) => void;
}) {
  const [fileUrl, setFileUrl] = React.useState("");
  const [number, setNumber] = React.useState("");

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (fileUrl.trim() === "") return;

        onSubmit(fileUrl.trim(), number.trim());
        setFileUrl("");
        setNumber("");
      }}
    >
      <Field label="File address" htmlFor={`doc-url-${type}`} className="min-w-56 flex-1">
        <Input
          id={`doc-url-${type}`}
          type="url"
          value={fileUrl}
          onChange={(event) => setFileUrl(event.target.value)}
          placeholder="https://…/cnic-front.jpg"
          className="h-11"
        />
      </Field>

      <Field label="Number on it" htmlFor={`doc-number-${type}`} className="w-44">
        <Input
          id={`doc-number-${type}`}
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          placeholder="Optional"
          className="h-11"
        />
      </Field>

      <Button type="submit" variant="outline" loading={pending} disabled={fileUrl.trim() === ""}>
        <Upload className="size-4" />
        {hasExisting ? "Replace" : "Upload"}
      </Button>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-extrabold text-primary">{title}</h2>
        {description !== undefined && <p className="text-sm text-secondary">{description}</p>}
      </div>
      {children}
    </section>
  );
}
