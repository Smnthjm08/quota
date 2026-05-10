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
import Logo from "../../utils/logo";
import { useState } from "react";
import { authClient } from "@workspace/auth/client";
import LinkButton from "../../ui/link-button";

const ForgotPasswordForm = () => {
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
    <section className="relative flex h-screen items-center justify-center bg-foreground py-8 sm:py-16 lg:py-20 dark:bg-background">
      <div className="pointer-events-none absolute inset-0 right-0 hidden overflow-hidden md:block">
        {/* Outer big circle */}
        <div className="absolute top-0 left-1/1 h-650 w-650 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10" />
        {/* Inner circle */}
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
                Forgot your password?
              </CardTitle>
              <CardDescription className="text-sm font-normal text-muted-foreground">
                Please enter the email address associated with your account and
                we will email you a link to reset your password.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
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
                  <LinkButton
                    href="/login"
                    className="h-10 rounded-xl"
                    size={"lg"}
                    variant={"ghost"}
                  >
                    Back to Login
                  </LinkButton>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ForgotPasswordForm;
