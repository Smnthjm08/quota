"use client";

import { PricingCard } from "@/components/ui/pricing-card";
import { type Plan as PricingPlan } from "@/lib/billingsdk-config";
import { Button } from "@workspace/ui/components/button";
import { useOnboardingPlans } from "@/hooks/use-onboarding-plans";

type PlanRecord = {
  id: number;
  key: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: string;
  dodoProductId: string;
};

const planFeatures = {
  starter: [
    { name: "Company onboarding", icon: "check", iconColor: "text-green-500" },
    { name: "Wallet setup", icon: "check", iconColor: "text-blue-500" },
    { name: "Plan management", icon: "check", iconColor: "text-teal-500" },
    { name: "Email support", icon: "check", iconColor: "text-zinc-500" },
  ],
  team: [
    { name: "Company onboarding", icon: "check", iconColor: "text-green-500" },
    { name: "Wallet setup", icon: "check", iconColor: "text-blue-500" },
    { name: "Plan management", icon: "check", iconColor: "text-teal-500" },
    { name: "Priority support", icon: "check", iconColor: "text-orange-500" },
  ],
} satisfies Record<"starter" | "team", PricingPlan["features"]>;

type PlanKey = keyof typeof planFeatures;

function isPlanKey(planKey: string): planKey is PlanKey {
  return planKey in planFeatures;
}

function getPlanFeatures(planKey: string) {
  return isPlanKey(planKey) ? planFeatures[planKey] : planFeatures.starter;
}

function getCurrencySymbol(currency: string) {
  const upperCurrency = currency.toUpperCase();

  if (upperCurrency === "USD") return "$";
  if (upperCurrency === "EUR") return "€";
  if (upperCurrency === "GBP") return "£";

  return upperCurrency;
}

function formatPriceFromCents(priceCents: number) {
  const amount = priceCents / 100;

  return Number.isInteger(amount)
    ? amount.toFixed(0)
    : amount.toFixed(2).replace(/\.00$/, "");
}

function formatPlanTitle(planKey: string) {
  return planKey
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildPlanDescription(plan: PlanRecord) {
  return `${plan.name} · Billed ${plan.interval}ly`;
}

function buildButtonText(plan: PlanRecord) {
  if (plan.priceCents === 0) {
    return "Start free";
  }

  return `Choose ${formatPlanTitle(plan.key)}`;
}

function mapPlanRecordToPricingPlan(plan: PlanRecord): PricingPlan {
  const title = formatPlanTitle(plan.key);

  return {
    id: String(plan.id),
    key: plan.key,
    title,
    description: buildPlanDescription(plan),
    currency: getCurrencySymbol(plan.currency),
    monthlyPrice: formatPriceFromCents(plan.priceCents),
    yearlyPrice: formatPriceFromCents(plan.priceCents),
    buttonText: buildButtonText(plan),
    highlight: plan.key === "team",
    badge: plan.key === "team" ? "Most popular" : undefined,
    features: getPlanFeatures(plan.key),
  };
}

export function OnboardingPlanPricingCard() {
  const {
    plans,
    isLoading,
    isSubmitting,
    errorMessage,
    handlePlanSelect,
    reloadPlans,
  } = useOnboardingPlans({ mapPlanRecordToPricingPlan });

  if (isLoading) {
    return (
      <section className="bg-background py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-12 space-y-3 text-center">
            <div className="mx-auto h-4 w-28 animate-pulse rounded-full bg-muted" />
            <div className="mx-auto h-10 w-80 animate-pulse rounded-xl bg-muted" />
            <div className="mx-auto h-5 w-full max-w-2xl animate-pulse rounded-full bg-muted" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-104 animate-pulse rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <div className="mb-5 h-6 w-24 rounded-full bg-muted" />
                <div className="mb-3 h-8 w-32 rounded-lg bg-muted" />
                <div className="mb-6 h-4 w-3/4 rounded-full bg-muted" />
                <div className="mb-4 h-12 w-full rounded-xl bg-muted" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((__, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="h-4 w-full rounded-full bg-muted"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (errorMessage && plans.length === 0) {
    return (
      <section className="bg-background py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Pricing unavailable
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">
              We could not load plans
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{errorMessage}</p>
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => {
                  reloadPlans();
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!isLoading && plans.length === 0) {
    return (
      <section className="bg-background py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              No plans found
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">
              There are no plans to choose from yet
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Add plans to the database, then reload this page.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  reloadPlans();
                }}
              >
                Reload
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className={isSubmitting ? "pointer-events-none opacity-80" : ""}>
      {errorMessage ? (
        <div className="container mx-auto max-w-7xl px-4 pt-6">
          <div
            className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {errorMessage}
          </div>
        </div>
      ) : null}

      <div className="container mx-auto max-w-7xl px-4 pt-6 text-center">
        {isSubmitting ? (
          <p className="text-sm text-muted-foreground">
            Saving your selected plan...
          </p>
        ) : null}
      </div>

      <PricingCard
        plans={plans}
        title="Choose Your Plan"
        description="Plans are loaded from the database-backed pricing model and saved before you continue onboarding."
        subtitle="Simple Pricing"
        onPlanSelect={handlePlanSelect}
        size="medium"
        className="w-full px-4"
        showBillingToggle={false}
        billingToggleLabels={{
          monthly: "Monthly",
          yearly: "Yearly",
        }}
      />
    </div>
  );
}

export const PricingCardDemo = OnboardingPlanPricingCard;
