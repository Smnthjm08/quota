"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@workspace/auth/client";
import { AuthPageShell } from "../auth-page-shell";

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("Missing reset token. Please request a new reset link.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    await authClient.resetPassword(
      {
        newPassword,
        token,
      },
      {
        onRequest: () => {
          setIsSubmitting(true);
        },
        onSuccess: () => {
          setIsSubmitting(false);
          router.push("/login");
          router.refresh();
        },
        onError: (ctx) => {
          setIsSubmitting(false);
          setErrorMessage(
            ctx.error.message || "Unable to reset password. Please try again."
          );
        },
      }
    );
  };

  return (
    <AuthPageShell
      title="Reset your password"
      description="Enter your new password and confirm it to complete reset."
    >
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-6">
          <Field className="gap-1.5">
            <FieldLabel
              htmlFor="new-password"
              className="text-sm font-normal text-muted-foreground"
            >
              New Password*
            </FieldLabel>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Enter your new password"
              required
              className="h-9 rounded-md dark:bg-background"
            />
          </Field>

          <Field className="gap-1.5">
            <FieldLabel
              htmlFor="confirm-password"
              className="text-sm font-normal text-muted-foreground"
            >
              Confirm Password*
            </FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm your new password"
              required
              className="h-9 rounded-md dark:bg-background"
            />
          </Field>

          <Field className="gap-4">
            <Button
              type="submit"
              size={"lg"}
              disabled={isSubmitting}
              className="h-10 cursor-pointer rounded-lg"
            >
              {isSubmitting ? "Resetting password..." : "Reset password"}
            </Button>
            {errorMessage ? (
              <FieldDescription className="text-center text-sm font-normal text-destructive">
                {errorMessage}
              </FieldDescription>
            ) : null}
            <FieldDescription className="text-center text-sm font-normal text-muted-foreground">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-medium text-card-foreground no-underline!"
              >
                Back to login
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </AuthPageShell>
  );
};

export default ResetPasswordForm;
