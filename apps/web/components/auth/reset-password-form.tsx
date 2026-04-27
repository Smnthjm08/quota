"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import Logo from "../logo";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@workspace/auth/client";

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
    <section className="relative flex min-h-screen items-center justify-center bg-foreground dark:bg-background">
      <div className="pointer-events-none absolute inset-0 right-0 hidden overflow-hidden md:block">
        <div className="absolute top-0 left-1/1 h-650 w-650 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10" />
        <div className="absolute top-0 left-1/1 h-175 w-175 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground dark:bg-background" />
      </div>

      <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-0 md:py-20">
        <Card className="relative gap-6 px-6 py-8 sm:p-12">
          <CardHeader className="gap-6 p-0 text-center">
            <div className="mx-auto">
              <Logo />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl font-medium text-card-foreground">
                Reset your password
              </CardTitle>
              <CardDescription className="text-sm font-normal text-muted-foreground">
                Enter your new password and confirm it to complete reset.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
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
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ResetPasswordForm;
