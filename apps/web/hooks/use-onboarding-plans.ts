"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axios";
import { type Plan as PricingPlan } from "@/lib/billingsdk-config";
import { useAuthSession } from "@/hooks/use-auth-session";
import { getOnboardingRoute } from "@/lib/onboarding-route";

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

type UseOnboardingPlansInput = {
  mapPlanRecordToPricingPlan: (plan: PlanRecord) => PricingPlan;
};

export function useOnboardingPlans({
  mapPlanRecordToPricingPlan,
}: UseOnboardingPlansInput) {
  const router = useRouter();
  const { refreshSession } = useAuthSession();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
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
  }, [mapPlanRecordToPricingPlan]);

  const reloadPlans = () => {
    setIsLoading(true);
    void loadPlans();
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPlans();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPlans]);

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

      const refreshedSession = await refreshSession();
      router.push(getOnboardingRoute(refreshedSession?.company ?? null));
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "We could not save that plan. Please try again.")
      );
      setIsSubmitting(false);
    }
  };

  return {
    plans,
    isLoading,
    isSubmitting,
    errorMessage,
    handlePlanSelect,
    reloadPlans,
  };
}