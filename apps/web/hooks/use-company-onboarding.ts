"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axios";
import { useAuthSession } from "@/hooks/use-auth-session";

type CompanyOnboardingInput = {
  name: string;
  website: string;
  size: string;
  address: string;
  city: string;
  stateValue: string;
  pinCode: string;
};

export function useCompanyOnboarding() {
  const router = useRouter();
  const { refreshSession } = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const submitCompany = async (payload: CompanyOnboardingInput) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (
      !payload.name.trim() ||
      !payload.website.trim() ||
      !payload.size.trim()
    ) {
      setErrorMessage("Please fill all required company fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      await axiosInstance.post("/api/v1/onboarding/company", {
        name: payload.name,
        size: payload.size,
        website: payload.website,
        address: payload.address,
        state: payload.stateValue,
        city: payload.city,
        pin_code: payload.pinCode,
      });

      setSuccessMessage("Company registered successfully.");
      await refreshSession();
      router.push("/onboarding/plan");
    } catch (err: unknown) {
      let message = "Failed to register company";

      if (typeof err === "object" && err !== null) {
        const error = err as {
          message?: string;
          response?: { data?: { error?: string } };
        };

        message = error.response?.data?.error ?? error.message ?? message;
      }

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitCompany,
    isSubmitting,
    errorMessage,
    successMessage,
  };
}
