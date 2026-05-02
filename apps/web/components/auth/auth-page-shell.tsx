"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import Logo from "../logo";

type AuthPageShellProps = Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>;

export function AuthPageShell({
  title,
  description,
  children,
}: AuthPageShellProps) {
  return (
    <section className="relative flex min-h-screen items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0 right-0 hidden overflow-hidden md:block">
        <div className="absolute top-0 left-1/1 h-650 w-650 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10" />
        <div className="absolute top-0 left-1/1 h-175 w-175 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
      </div>

      <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-0 md:py-20">
        <Card className="relative gap-6 px-6 py-8 sm:p-12">
          <CardHeader className="gap-6 p-0 text-center">
            <div className="mx-auto">
              <Logo />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl font-medium text-card-foreground">
                {title}
              </CardTitle>
              <CardDescription className="text-sm font-normal text-muted-foreground">
                {description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">{children}</CardContent>
        </Card>
      </div>
    </section>
  );
}
