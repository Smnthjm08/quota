"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PricingCard } from "@/components/ui/pricing-card";
import { axiosInstance } from "@/lib/axios";
import { type Plan as PricingPlan } from "@/lib/billingsdk-config";
import { Button } from "@workspace/ui/components/button";

type PlanRecord = {
  id: number;
  key: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: string;
  dodoProductId: string;
};

type PlanResponse = {
  message: string;
  data: PlanRecord[];
  error: string | null;
};

type PlanSelectionResponse = {
  message?: string;
  data?: {
    session_id?: string;
    checkout_url?: string;
    checkoutUrl?: string;
    url?: string;
  };
  error?: string | null;
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

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const response = error as {
      response?: { data?: { error?: string; message?: string } };
      message?: string;
    };

    if (typeof response.response?.data?.error === "string") {
      return response.response.data.error;
    }

    if (typeof response.response?.data?.message === "string") {
      return response.response.data.message;
    }

    if (typeof response.message === "string") {
      return response.message;
    }
  }

  return fallback;
}

function isPlanRecord(value: unknown): value is PlanRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const plan = value as Partial<PlanRecord>;

  return (
    typeof plan.id === "number" &&
    typeof plan.key === "string" &&
    typeof plan.name === "string" &&
    typeof plan.priceCents === "number" &&
    typeof plan.currency === "string" &&
    typeof plan.interval === "string" &&
    typeof plan.dodoProductId === "string"
  );
}

function extractPlanRecords(payload: unknown): PlanRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isPlanRecord);
  }

  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const response = payload as {
    data?: unknown;
  };

  if (Array.isArray(response.data)) {
    return response.data.filter(isPlanRecord);
  }

  if (typeof response.data === "object" && response.data !== null) {
    const nestedData = response.data as { plans?: unknown };

    if (Array.isArray(nestedData.plans)) {
      return nestedData.plans.filter(isPlanRecord);
    }
  }

  return [];
}

function extractCheckoutUrl(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const response = payload as {
    data?: {
      checkout_url?: unknown;
      checkoutUrl?: unknown;
      url?: unknown;
    };
  };

  const checkoutUrl =
    response.data?.checkout_url ??
    response.data?.checkoutUrl ??
    response.data?.url;

  return typeof checkoutUrl === "string" && checkoutUrl.length > 0
    ? checkoutUrl
    : null;
}

export function OnboardingPlanPricingCard() {
  const router = useRouter();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPlans = async () => {
    setErrorMessage(null);

    try {
      const response = await axiosInstance.get<PlanResponse | PlanRecord[]>(
        "/api/v1/onboarding/plan"
      );
      const rawPlans = extractPlanRecords(response.data);

      setPlans(rawPlans.map(mapPlanRecordToPricingPlan));
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "We could not load the available plans right now."
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlans();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handlePlanSelect = async (planId: string | number) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const body: { planId: string | number } = { planId };

      if (typeof planId === "string" && /^\d+$/.test(planId)) {
        body.planId = Number(planId);
      }

      const response = await axiosInstance.post<PlanSelectionResponse>(
        "/api/v1/onboarding/plan",
        body
      );

      const checkoutUrl = extractCheckoutUrl(response.data);

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      router.push("/onboarding/wallet");
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "We could not save that plan. Please try again.")
      );
      setIsSubmitting(false);
    }
  };

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
                  setIsLoading(true);
                  void loadPlans();
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
                  setIsLoading(true);
                  void loadPlans();
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
        theme="classic"
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
