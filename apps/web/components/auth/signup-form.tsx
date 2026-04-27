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
  FieldSeparator,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import Logo from "../logo";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@workspace/auth/client";

const SignUpForm = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] = useState<
    "google" | "github" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSocialSignIn = async (provider: "google" | "github") => {
    setErrorMessage(null);

    await authClient.signIn.social(
      {
        provider,
        callbackURL: "/onboarding",
      },
      {
        onRequest: () => {
          setActiveSocialProvider(provider);
        },
        onSuccess: () => {
          setActiveSocialProvider(null);
        },
        onError: (ctx) => {
          setActiveSocialProvider(null);
          setErrorMessage(
            ctx.error.message || "Unable to continue with social sign up."
          );
        },
      }
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    await authClient.signUp.email(
      {
        email,
        password,
        name,
        image: undefined,
        callbackURL: "/onboarding",
      },
      {
        onRequest: () => {
          setIsSubmitting(true);
        },
        onSuccess: () => {
          setIsSubmitting(false);
          router.push("/dashboard");
          router.refresh();
        },
        onError: (ctx) => {
          setIsSubmitting(false);
          setErrorMessage(
            ctx.error.message || "Unable to create account. Please try again."
          );
        },
      }
    );
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center bg-foreground dark:bg-background">
      <div className="pointer-events-none absolute inset-0 right-0 hidden overflow-hidden md:block">
        {/* Outer big circle */}
        <div className="absolute top-0 left-1/1 h-650 w-650 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10" />
        {/* Inner circle */}
        <div className="absolute top-0 left-1/1 h-175 w-175 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground dark:bg-background" />
      </div>

      <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-0 md:py-20">
        <Card className="relative max-w-lg gap-6 px-6 py-8 sm:p-12">
          <CardHeader className="gap-6 p-0 text-center">
            <div className="mx-auto">
              <Logo />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl font-medium text-card-foreground">
                Signup to Quota
              </CardTitle>
              <CardDescription className="text-sm font-normal text-muted-foreground">
                Signup to your account now
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmit}>
              <FieldGroup className="gap-6">
                <Field className="grid gap-3 md:grid-cols-2 md:gap-6">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => handleSocialSignIn("google")}
                    disabled={isSubmitting || activeSocialProvider !== null}
                    className="text-medium h-9 cursor-pointer gap-2 rounded-lg text-sm text-card-foreground shadow-xs dark:bg-background"
                  >
                    <Image
                      src="https://images.shadcnspace.com/assets/svgs/icon-google.svg"
                      alt="google icon"
                      width={16}
                      height={16}
                    />
                    {activeSocialProvider === "google"
                      ? "Redirecting..."
                      : "Sign up with Google"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => handleSocialSignIn("github")}
                    disabled={isSubmitting || activeSocialProvider !== null}
                    className="text-medium h-9 cursor-pointer gap-2 rounded-lg text-sm text-card-foreground shadow-xs dark:bg-background"
                  >
                    <Image
                      src="https://images.shadcnspace.com/assets/svgs/icon-github.svg"
                      alt="github icon"
                      width={16}
                      height={16}
                      className="dark:hidden"
                    />
                    <Image
                      src="https://images.shadcnspace.com/assets/svgs/icon-github-white.svg"
                      alt="github icon"
                      width={16}
                      height={16}
                      className="hidden dark:block"
                    />
                    {activeSocialProvider === "github"
                      ? "Redirecting..."
                      : "Sign up with Github"}
                  </Button>
                </Field>
                <FieldSeparator className="bg-transparent text-sm text-muted-foreground *:data-[slot=field-separator-content]:bg-card">
                  <span className="px-4">or sign up with</span>
                </FieldSeparator>

                <div className="flex flex-col gap-4">
                  <Field className="gap-1.5">
                    <FieldLabel
                      htmlFor="name"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Name*
                    </FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="enter your name"
                      required
                      className="h-9 rounded-md dark:bg-background"
                    />
                  </Field>
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
                      className="h-9 rounded-md dark:bg-background"
                    />
                  </Field>
                  <Field className="gap-1.5">
                    <FieldLabel
                      htmlFor="password"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Password*
                    </FieldLabel>

                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      required
                      className="h-9 rounded-md dark:bg-background"
                    />
                  </Field>
                </div>

                <Field className="gap-4">
                  <Button
                    type="submit"
                    size={"lg"}
                    disabled={isSubmitting}
                    className="h-10 cursor-pointer rounded-lg hover:bg-primary/80"
                  >
                    {isSubmitting ? "Creating account..." : "Sign up"}
                  </Button>
                  {errorMessage ? (
                    <FieldDescription className="text-center text-sm font-normal text-destructive">
                      {errorMessage}
                    </FieldDescription>
                  ) : null}
                  <FieldDescription className="text-center text-sm font-normal text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-card-foreground no-underline!"
                    >
                      Login{" "}
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

export default SignUpForm;
