"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, MessageSquareText, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { OtpCodeStep } from "@/components/auth/otp-code-step";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { useOtpConfig, useSendOtp } from "@/hooks/use-otp";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { homeRouteForRole, type AuthUser } from "@/types/auth";

/**
 * The API normalises 03XXXXXXXXX, 92XXXXXXXXXX and +923XXXXXXXXX into E.164
 * itself, so this only has to recognise the three shapes, not canonicalise them.
 */
const PK_MOBILE = /^(?:\+92|92|0)?3\d{9}$/;

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "Enter your phone number")
    .refine((value) => PK_MOBILE.test(value.replace(/[\s-]/g, "")), "Enter a valid mobile number, like 0300 1234567"),
  password: z.string().min(1, "Enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;

const phoneSchema = loginSchema.pick({ phone: true });

type PhoneValues = z.infer<typeof phoneSchema>;

type Mode = "password" | "code";

/**
 * Only same-origin paths are honoured. Without this check `?next=` is an open
 * redirect: a crafted link would send someone to another site carrying the
 * trust of having just signed in here.
 */
function safeNextPath(next: string | null): string | null {
  if (next === null || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }

  return next;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const otpConfig = useOtpConfig();
  const [mode, setMode] = React.useState<Mode>("password");

  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const nextPath = safeNextPath(searchParams.get("next"));
  const sessionExpired = searchParams.get("reason") === "expired";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  const signedIn = (user: AuthUser) => {
    toast.success(`Welcome back, ${user.fullName.split(" ")[0]}`);
    router.replace(nextPath ?? homeRouteForRole(user));
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      signedIn(await login(values));
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.status === 429
            ? "Too many attempts. Wait a few minutes, then try again."
            : error.status === 401
              ? "That phone number and password do not match."
              : error.message
          : "Something went wrong. Please try again.";

      setFormError(message);
    }
  });

  return (
    <RevealGroup trigger="mount" className="flex flex-col gap-6">
      <RevealItem className="flex flex-col gap-2">
        <h1 className="text-3xl">Welcome back</h1>
        <p className="text-secondary">Sign in to track orders, save addresses and reorder in a tap.</p>
      </RevealItem>

      {/* Only offered once the API can actually text: a tab that leads to a
          code which never arrives is worse than no tab. */}
      {otpConfig.data?.enabled === true && (
        <RevealItem>
          <div
            role="tablist"
            aria-label="How to sign in"
            className="grid grid-cols-2 gap-1 rounded-full border border-border-default bg-surface-muted p-1"
          >
            {(
              [
                { value: "password", label: "Password", icon: Lock },
                { value: "code", label: "Text me a code", icon: MessageSquareText },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => {
                  setFormError(null);
                  setMode(value);
                }}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                  mode === value ? "bg-surface text-primary shadow-card" : "text-secondary hover:text-primary",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </RevealItem>
      )}

      {sessionExpired && (
        <RevealItem
          role="status"
          className="rounded-[var(--radius-card)] border border-border-default bg-surface-muted px-4 py-3 text-sm text-secondary"
        >
          Your session expired. Sign in again to pick up where you left off.
        </RevealItem>
      )}

      {mode === "code" ? (
        <RevealItem>
          <CodeSignIn onSignedIn={signedIn} />
        </RevealItem>
      ) : (
        <RevealItem>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {formError !== null && (
              <p
                role="alert"
                className="rounded-[var(--radius-input)] border border-danger bg-[var(--state-error-soft)] px-4 py-3 text-sm font-medium text-danger"
              >
                {formError}
              </p>
            )}

            <Field label="Phone number" htmlFor="phone" required error={errors.phone?.message}>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0300 1234567"
                leadingIcon={<Phone className="size-4" />}
                invalid={errors.phone !== undefined}
                {...register("phone")}
              />
            </Field>

            <Field label="Password" htmlFor="password" required error={errors.password?.message}>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                leadingIcon={<Lock className="size-4" />}
                invalid={errors.password !== undefined}
                trailingIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    className="rounded-md text-muted transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
                {...register("password")}
              />
            </Field>

            <Button type="submit" size="lg" block loading={isSubmitting} loadingLabel="Signing you in…">
              Sign in
            </Button>
          </form>
        </RevealItem>
      )}

      <RevealItem className="text-sm text-secondary">
        New to ZassFood?{" "}
        <Link
          href={nextPath === null ? "/register" : `/register?next=${encodeURIComponent(nextPath)}`}
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </RevealItem>
    </RevealGroup>
  );
}

/** What a failed SMS sign-in should say. */
function describeCodeError(error: unknown): string {
  return error instanceof ApiError
    ? error.status === 429
      ? "Too many attempts. Wait a few minutes, then try again."
      : error.message
    : "Something went wrong. Please try again.";
}

/**
 * Signing in with a texted code instead of a password: the number, then the
 * code. For the customer who has forgotten their password, or never really
 * had one.
 */
function CodeSignIn({ onSignedIn }: { onSignedIn: (user: AuthUser) => void }) {
  const { loginWithOtp } = useAuth();
  const sendOtp = useSendOtp();

  const [sent, setSent] = React.useState<{
    phone: string;
    codeLength: number;
    resendAfterSeconds: number;
    sendCount: number;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [verifying, setVerifying] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const request = async (phone: string) => {
    const settings = await sendOtp.mutateAsync({ phone, purpose: "login" });

    setSent((current) => ({
      phone,
      codeLength: settings.codeLength,
      resendAfterSeconds: settings.resendAfterSeconds,
      sendCount: (current?.sendCount ?? 0) + 1,
    }));
  };

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      await request(values.phone);
    } catch (caught) {
      setError(describeCodeError(caught));
    }
  });

  return (
    <div className="flex flex-col gap-4">
      {error !== null && (
        <p
          role="alert"
          className="rounded-[var(--radius-input)] border border-danger bg-[var(--state-error-soft)] px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      {sent === null ? (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Field label="Phone number" htmlFor="code-phone" required error={errors.phone?.message}>
            <Input
              id="code-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0300 1234567"
              leadingIcon={<Phone className="size-4" />}
              invalid={errors.phone !== undefined}
              {...register("phone")}
            />
          </Field>

          <Button type="submit" size="lg" block loading={isSubmitting} loadingLabel="Texting your code…">
            Text me a code
          </Button>
        </form>
      ) : (
        <OtpCodeStep
          key={sent.sendCount}
          phone={sent.phone}
          codeLength={sent.codeLength}
          resendAfterSeconds={sent.resendAfterSeconds}
          submitting={verifying}
          resending={sendOtp.isPending}
          submitLabel="Sign in"
          onSubmit={(code) => {
            setError(null);
            setVerifying(true);

            loginWithOtp({ phone: sent.phone, code })
              .then(onSignedIn)
              .catch((caught: unknown) => setError(describeCodeError(caught)))
              .finally(() => setVerifying(false));
          }}
          onResend={() => {
            setError(null);
            request(sent.phone)
              .then(() => toast.success("We've sent you a new code."))
              .catch((caught: unknown) => setError(describeCodeError(caught)));
          }}
          onChangeNumber={() => {
            setError(null);
            setSent(null);
          }}
        />
      )}
    </div>
  );
}
