"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bike, Eye, EyeOff, Lock, Mail, Phone, ShoppingBag, Store, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { homeRouteForRole, UserRole, type SelfServiceRole } from "@/types/auth";

const PK_MOBILE = /^(?:\+92|92|0)?3\d{9}$/;

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120, "That name is too long"),
  phone: z
    .string()
    .min(1, "Enter your phone number")
    .refine((value) => PK_MOBILE.test(value.replace(/[\s-]/g, "")), "Enter a valid mobile number, like 0300 1234567"),
  // Mirrors the backend rule: at least 8 characters, with one letter and one digit.
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), "Include at least one letter and one number"),
  email: z.union([z.literal(""), z.email("Enter a valid email address")]),
  role: z.enum([UserRole.CUSTOMER, UserRole.RIDER, UserRole.VENDOR_OWNER]),
});

type RegisterValues = z.infer<typeof registerSchema>;

const ROLE_OPTIONS: ReadonlyArray<{
  value: SelfServiceRole;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: UserRole.CUSTOMER, label: "Order food", description: "Browse restaurants and get delivery", icon: ShoppingBag },
  { value: UserRole.RIDER, label: "Deliver", description: "Earn on your own schedule", icon: Bike },
  { value: UserRole.VENDOR_OWNER, label: "List a restaurant", description: "Take orders from your kitchen", icon: Store },
];

function safeNextPath(next: string | null): string | null {
  if (next === null || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }

  return next;
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerAccount } = useAuth();

  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const nextPath = safeNextPath(searchParams.get("next"));

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", phone: "", password: "", email: "", role: UserRole.CUSTOMER },
  });

  // useWatch rather than watch(): the latter returns a fresh function each
  // render, which the React Compiler cannot memoize safely.
  const selectedRole = useWatch({ control, name: "role" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const user = await registerAccount({
        fullName: values.fullName,
        phone: values.phone,
        password: values.password,
        role: values.role,
        // The API rejects unknown *and* empty optional fields, so only send it
        // when the person actually typed one.
        ...(values.email !== "" && { email: values.email }),
      });

      toast.success("Account created. Welcome to ZassDelivery.");
      router.replace(nextPath ?? homeRouteForRole(user));
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.status === 409
            ? "An account already exists for that phone number."
            : error.status === 429
              ? "Too many attempts. Wait a few minutes, then try again."
              : error.isValidationError && error.details.length > 0
                ? error.details[0]
                : error.message
          : "Something went wrong. Please try again.";

      setFormError(message);
    }
  });

  return (
    <RevealGroup trigger="mount" className="flex flex-col gap-6">
      <RevealItem className="flex flex-col gap-2">
        <h1 className="text-3xl">Create your account</h1>
        <p className="text-secondary">One account, whether you are ordering, delivering or selling.</p>
      </RevealItem>

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

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-semibold text-primary">I want to</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {ROLE_OPTIONS.map(({ value, label, description, icon: Icon }) => {
                const isSelected = selectedRole === value;

                return (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer flex-col gap-1 rounded-[var(--radius-input)] border p-3 transition-all duration-200",
                      "focus-within:ring-4 focus-within:ring-[var(--brand-ring)]",
                      isSelected
                        ? "border-brand bg-brand-soft text-primary"
                        : "border-border-default bg-surface-muted text-secondary hover:border-brand",
                    )}
                  >
                    <input
                      type="radio"
                      value={value}
                      checked={isSelected}
                      onChange={() => setValue("role", value, { shouldValidate: true })}
                      className="sr-only"
                    />
                    <Icon className={cn("size-5", isSelected ? "text-brand" : "text-muted")} />
                    <span className="text-sm font-semibold text-primary">{label}</span>
                    <span className="text-xs text-muted">{description}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Field label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
            <Input
              id="fullName"
              autoComplete="name"
              placeholder="Ayesha Khan"
              leadingIcon={<User className="size-4" />}
              invalid={errors.fullName !== undefined}
              {...register("fullName")}
            />
          </Field>

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

          <Field
            label="Email"
            htmlFor="email"
            hint="Optional — for receipts and order updates."
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              leadingIcon={<Mail className="size-4" />}
              invalid={errors.email !== undefined}
              {...register("email")}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            required
            hint="At least 8 characters, with a letter and a number."
            error={errors.password?.message}
          >
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
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

          <Button type="submit" size="lg" block loading={isSubmitting} loadingLabel="Creating your account…">
            Create account
          </Button>
        </form>
      </RevealItem>

      <RevealItem className="text-sm text-secondary">
        Already have an account?{" "}
        <Link
          href={nextPath === null ? "/login" : `/login?next=${encodeURIComponent(nextPath)}`}
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </RevealItem>
    </RevealGroup>
  );
}
