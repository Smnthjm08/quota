"use client";

import { useState } from "react";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axios";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useRouter } from "next/navigation";

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
  const { refreshSession, setManualSessionCompany } = useAuthSession();
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
      const response = await axiosInstance.post("/api/v1/onboarding/company", {
        name: payload.name,
        size: payload.size,
        website: payload.website,
        address: payload.address,
        state: payload.stateValue,
        city: payload.city,
        pin_code: payload.pinCode,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createdCompany = (response?.data as any)?.data ?? null;

      // Optimistically update client session with the created company
      try {
        setManualSessionCompany?.(createdCompany);
      } catch {
        // ignore
      }

      const refreshed = await refreshSession();

      // If the refreshed session does not yet contain the company, retry once briefly.
      // The onboarding route guard will handle the actual redirect once the session is ready.
      if (!refreshed?.company) {
        await new Promise((res) => setTimeout(res, 400));
        await refreshSession();
      }

      toast.success("Company registered successfully.");
      setSuccessMessage("Company registered successfully.");
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
