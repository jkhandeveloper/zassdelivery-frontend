"use client";

import { KeyRound } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

/** "+923001234567" → "0300 1234567", the way people read their own number. */
export function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("92") ? `0${digits.slice(2)}` : digits;

  return local.length === 11 ? `${local.slice(0, 4)} ${local.slice(4)}` : phone;
}

/** Seconds left of a wait that starts when the component mounts. */
function useCountdown(seconds: number): number {
  const [until] = React.useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  return Math.max(0, Math.ceil((until - now) / 1000));
}

/**
 * The second half of sign-up and SMS sign-in: the code we texted.
 *
 * Shared so both forms ask for it the same way — the digits in one box the
 * phone's keyboard can autofill from the message, a resend that waits out the
 * API's minute, and a way back to correct a mistyped number.
 *
 * Give it a fresh `key` for every code sent: the resend wait starts when it
 * mounts, and the digits typed for the previous code are no use for the next.
 */
export function OtpCodeStep({
  phone,
  codeLength,
  resendAfterSeconds,
  submitting,
  resending,
  submitLabel,
  onSubmit,
  onResend,
  onChangeNumber,
}: {
  phone: string;
  codeLength: number;
  /** The wait before another code may be requested, from when this mounts. */
  resendAfterSeconds: number;
  submitting: boolean;
  resending: boolean;
  submitLabel: string;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
}) {
  const [code, setCode] = React.useState("");
  const wait = useCountdown(resendAfterSeconds);
  const complete = code.length === codeLength;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (complete) onSubmit(code);
      }}
    >
      <p className="text-sm text-secondary">
        We texted a {codeLength}-digit code to{" "}
        <span className="numeric font-semibold text-primary">{displayPhone(phone)}</span>. It
        expires in a few minutes.
      </p>

      <Field label="Verification code" htmlFor="otp-code" required>
        <Input
          id="otp-code"
          value={code}
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, "").slice(0, codeLength))
          }
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder={"0".repeat(codeLength)}
          leadingIcon={<KeyRound className="size-4" />}
          className="numeric text-lg tracking-[0.3em]"
        />
      </Field>

      <Button
        type="submit"
        size="lg"
        block
        loading={submitting}
        disabled={!complete}
        loadingLabel="Checking the code…"
      >
        {submitLabel}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button
          type="button"
          onClick={onChangeNumber}
          className="font-semibold text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          Change number
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={wait > 0 || resending}
          className="font-semibold text-brand underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {resending ? "Sending…" : wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}
