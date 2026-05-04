import Link from "next/link";
import OnboardingRouteGuard from "@/components/onboarding/onboarding-route-guard";

export default function PlanSuccess() {
  return (
    <>
      <OnboardingRouteGuard />
      <main className="min-h-screen bg-background px-4 py-20">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center rounded-3xl border border-border/60 bg-card px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-medium tracking-[0.24em] text-muted-foreground uppercase">
            Payment received
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
            Your plan is being activated
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Dodo has confirmed the checkout. We are syncing the subscription
            state now, so your company access should become active automatically
            within a moment.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/onboarding/wallet"
              className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Continue onboarding
            </Link>
            <Link
              href="/onboarding/plan"
              className="inline-flex items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Review plans
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
