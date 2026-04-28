"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@workspace/auth/client";
import { AuthPageShell } from "../auth-page-shell";

const ForgotPasswordForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    await authClient.requestPasswordReset(
      {
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      },
      {
        onRequest: () => {
          setIsSubmitting(true);
        },
        onSuccess: () => {
          setIsSubmitting(false);
          setSuccessMessage(
            "If this email exists, a reset link has been sent."
          );
        },
        onError: (ctx: { error: { message?: string } }) => {
          setIsSubmitting(false);
          setErrorMessage(
            ctx.error.message ||
              "Unable to start password reset. Please try again."
          );
        },
      }
    );
  };

  return (
    <AuthPageShell
      title="Forgot your password?"
      description="Please enter the email address associated with your account and we will email you a link to reset your password."
    >
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-6">
          <div className="flex flex-col gap-4">
            <Field className="gap-1.5">
              <FieldLabel
                htmlFor="email"
                className="text-sm font-normal text-muted-foreground"
              >
                Email*
              </FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@shadcnspace.com"
                required
                className="h-9 dark:bg-background"
              />
            </Field>
          </div>
          <Field className="gap-4">
            <Button
              type="submit"
              size={"lg"}
              disabled={isSubmitting}
              className="h-10 cursor-pointer rounded-xl"
            >
              {isSubmitting ? "Sending reset link..." : "Forgot password"}
            </Button>
            {errorMessage ? (
              <FieldDescription className="text-center text-sm font-normal text-destructive">
                {errorMessage}
              </FieldDescription>
            ) : null}
            {successMessage ? (
              <FieldDescription className="text-center text-sm font-normal text-emerald-600 dark:text-emerald-400">
                {successMessage}
              </FieldDescription>
            ) : null}
            <Button
              type="button"
              size={"lg"}
              variant={"ghost"}
              onClick={() => router.push("/login")}
              className="h-10 cursor-pointer rounded-xl hover:bg-primary/10"
            >
              Back to Login
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </AuthPageShell>
  );
};

export default ForgotPasswordForm;
