"use client";

import { useMutation } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";

/** The API's own rule: at least 8 characters, with one letter and one digit. */
function isStrongEnough(password: string): boolean {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

/**
 * Change the password behind the account.
 *
 * The API signs out every *other* session when this succeeds and leaves this
 * one alone, so there is nothing to do afterwards but say so.
 */
export function PasswordForm() {
  const change = useMutation({ mutationFn: authApi.changePassword });

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const weak = newPassword !== "" && !isStrongEnough(newPassword);
  const mismatch = confirmPassword !== "" && confirmPassword !== newPassword;

  const ready =
    currentPassword !== "" && isStrongEnough(newPassword) && confirmPassword === newPassword;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready) return;

        change.mutate(
          { currentPassword, newPassword },
          {
            onSuccess: () => {
              toast.success("Password changed. Your other devices have been signed out.");
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            },
            onError: (error) =>
              toast.error(
                error instanceof ApiError ? error.message : "We couldn't change your password.",
              ),
          },
        );
      }}
    >
      <Field label="Current password" htmlFor="password-current" required className="sm:max-w-sm">
        <Input
          id="password-current"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="New password"
          htmlFor="password-new"
          required
          hint="At least 8 characters, with a letter and a number."
          error={weak ? "Use at least 8 characters, with a letter and a number." : undefined}
        >
          <Input
            id="password-new"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            invalid={weak}
            required
          />
        </Field>

        <Field
          label="Confirm new password"
          htmlFor="password-confirm"
          required
          error={mismatch ? "The two passwords don't match." : undefined}
        >
          <Input
            id="password-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            invalid={mismatch}
            required
          />
        </Field>
      </div>

      <Button type="submit" loading={change.isPending} disabled={!ready} className="self-start">
        Change password
      </Button>
    </form>
  );
}
