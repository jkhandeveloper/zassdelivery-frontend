"use client";

import { Plus, QrCode, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import {
  MAX_PAYMENT_QR_CODES,
  QR_PROVIDER_LABELS,
  QR_PROVIDER_ORDER,
} from "@/lib/payment-labels";
import { PaymentQrProvider } from "@/types/enums";
import type { PaymentQrCodeDto, PaymentQrCodeInputDto } from "@/types/payment";

interface Draft {
  /** Local identity only, so each row keeps its own upload state as rows come and go. */
  key: number;
  provider: PaymentQrProvider;
  label: string;
  accountTitle: string;
  accountNumber: string;
  imageUrl: string;
}

let nextDraftKey = 0;

function toDraft(code?: PaymentQrCodeDto, accountTitle = ""): Draft {
  nextDraftKey += 1;

  return {
    key: nextDraftKey,
    provider: code?.provider ?? PaymentQrProvider.JAZZCASH,
    label: code?.label ?? "",
    accountTitle: code?.accountTitle ?? accountTitle,
    accountNumber: code?.accountNumber ?? "",
    imageUrl: code?.imageUrl ?? "",
  };
}

/** Only a bank or an "other" wallet needs naming — JazzCash is already its own name. */
function isNamed(provider: PaymentQrProvider): boolean {
  return provider === PaymentQrProvider.BANK || provider === PaymentQrProvider.OTHER;
}

function toInput(draft: Draft): PaymentQrCodeInputDto {
  const label = draft.label.trim();
  const accountNumber = draft.accountNumber.trim();

  return {
    provider: draft.provider,
    accountTitle: draft.accountTitle.trim(),
    imageUrl: draft.imageUrl,
    ...(isNamed(draft.provider) && label !== "" && { label }),
    ...(accountNumber !== "" && { accountNumber }),
  };
}

export interface PaymentQrEditorProps {
  codes: PaymentQrCodeDto[];
  onSave: (codes: PaymentQrCodeInputDto[]) => void;
  saving: boolean;
  /** Look but don't touch — for someone who may not change where the money goes. */
  disabled?: boolean;
  /** Pre-fills a new code's account title: the name customers see in their app. */
  defaultAccountTitle?: string;
}

/**
 * Edits a list of scan-to-pay codes and saves it whole.
 *
 * The API replaces the list rather than patching it, so this holds the full
 * draft and sends all of it — a removed code is gone, not left behind by a save
 * that only knew about the rows still on screen.
 */
export function PaymentQrEditor({
  codes,
  onSave,
  saving,
  disabled = false,
  defaultAccountTitle = "",
}: PaymentQrEditorProps) {
  const [drafts, setDrafts] = React.useState<Draft[]>(() => codes.map((code) => toDraft(code)));

  const update = (key: number, patch: Partial<Draft>) =>
    setDrafts((current) =>
      current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)),
    );

  const incomplete = drafts.some(
    (draft) => draft.imageUrl === "" || draft.accountTitle.trim().length < 2,
  );

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (incomplete) return;
        onSave(drafts.map(toInput));
      }}
    >
      {drafts.length === 0 ? (
        <EmptyState
          density="inline"
          icon={<QrCode className="size-6" />}
          title="No QR codes yet"
          description="Add the JazzCash, Easypaisa or bank QR you'd like customers to scan."
        />
      ) : (
        <ol className="flex flex-col gap-4">
          {drafts.map((draft, index) => (
            <li
              key={draft.key}
              className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border-subtle p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-primary">QR code {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-danger"
                  disabled={disabled}
                  onClick={() =>
                    setDrafts((current) => current.filter((entry) => entry.key !== draft.key))
                  }
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="App or bank" htmlFor={`qr-provider-${draft.key}`}>
                  <NativeSelect
                    id={`qr-provider-${draft.key}`}
                    value={draft.provider}
                    disabled={disabled}
                    onChange={(event) =>
                      update(draft.key, { provider: event.target.value as PaymentQrProvider })
                    }
                  >
                    {QR_PROVIDER_ORDER.map((provider) => (
                      <option key={provider} value={provider}>
                        {QR_PROVIDER_LABELS[provider]}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>

                {isNamed(draft.provider) && (
                  <Field
                    label={draft.provider === PaymentQrProvider.BANK ? "Bank name" : "App name"}
                    htmlFor={`qr-label-${draft.key}`}
                    hint="Shown above the code, so customers know which app to open."
                  >
                    <Input
                      id={`qr-label-${draft.key}`}
                      value={draft.label}
                      disabled={disabled}
                      maxLength={60}
                      placeholder={
                        draft.provider === PaymentQrProvider.BANK ? "Meezan Bank" : "SadaPay"
                      }
                      onChange={(event) => update(draft.key, { label: event.target.value })}
                    />
                  </Field>
                )}

                <Field
                  label="Account title"
                  htmlFor={`qr-title-${draft.key}`}
                  required
                  hint="The name customers see in their app before they confirm."
                >
                  <Input
                    id={`qr-title-${draft.key}`}
                    value={draft.accountTitle}
                    disabled={disabled}
                    maxLength={120}
                    required
                    onChange={(event) => update(draft.key, { accountTitle: event.target.value })}
                  />
                </Field>

                <Field
                  label="Account or mobile number"
                  htmlFor={`qr-number-${draft.key}`}
                  hint="For a customer whose camera won't read the code."
                >
                  <Input
                    id={`qr-number-${draft.key}`}
                    value={draft.accountNumber}
                    disabled={disabled}
                    maxLength={40}
                    placeholder="03001234567"
                    className="numeric"
                    onChange={(event) => update(draft.key, { accountNumber: event.target.value })}
                  />
                </Field>
              </div>

              <ImageUploadField
                id={`qr-image-${draft.key}`}
                label="QR code image"
                hint="A screenshot of the QR from your app works — crop it close for the cleanest scan."
                required
                folder="payment-qr-codes"
                value={draft.imageUrl}
                onChange={(url) => update(draft.key, { imageUrl: url })}
                variant="store"
                disabled={disabled}
              />
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || drafts.length >= MAX_PAYMENT_QR_CODES}
          onClick={() =>
            setDrafts((current) => [...current, toDraft(undefined, defaultAccountTitle)])
          }
        >
          <Plus className="size-4" />
          Add a QR code
        </Button>
        <Button type="submit" loading={saving} disabled={disabled || incomplete}>
          Save QR codes
        </Button>
        {incomplete && !disabled && (
          <p className="text-sm text-muted">Each code needs an image and an account title.</p>
        )}
      </div>
    </form>
  );
}
