import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import Logo from "../logo";

const ForgotPassword = () => {
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
            <form>
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
                    className="h-10 cursor-pointer rounded-xl"
                  >
                    Forgot password
                  </Button>
                  <Button
                    type="submit"
                    size={"lg"}
                    variant={"ghost"}
                    className="h-10 cursor-pointer rounded-xl hover:bg-primary/10"
                  >
                    Back to Login
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ForgotPassword;
