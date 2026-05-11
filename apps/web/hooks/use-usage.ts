"use client";

import { useCallback, useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";

export type UsageSeat = {
  id: string;
  name: string;
  active: boolean;
  monthlyLimit: number;
  consumed: number;
  seatType: "HUMAN" | "AGENT";
};

export type UsageEvent = {
  id: string;
  type:
    | "VAULT_CREATED"
    | "VAULT_FUNDED"
    | "SEAT_CREATED"
    | "SEAT_UPDATED"
    | "SEAT_TOGGLED"
    | "API_CONSUMED";
  title: string;
  amountUsdc: number | null;
  txSignature: string | null;
  createdAt: string;
  seat?: {
    id: string;
    name: string;
  } | null;
};

export type UsageSummary = {
  totalDeposited: number;
  usedBalance: number;
  availableBalance: number;
  activeSeats: number;
  totalSeats: number;
  consumedBalance: number;
};

export type UsageData = {
  summary: UsageSummary;
  seats: UsageSeat[];
  events: UsageEvent[];
};

type UsageResponse = {
  message: string;
  data: UsageData;
  error?: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const response = error as {
      response?: { data?: { message?: string; error?: string } };
      message?: string;
    };

    if (typeof response.response?.data?.message === "string") {
      return response.response.data.message;
    }

    if (typeof response.response?.data?.error === "string") {
      return response.response.data.error;
    }

    if (typeof response.message === "string") {
      return response.message;
    }
  }

  return fallback;
}

export function useUsage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadUsage = useCallback(async () => {
    setErrorMessage(null);

    try {
      const response = await axiosInstance.get<UsageResponse>("/api/v1/usage");
      setData(response.data.data ?? null);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "We could not load usage right now.")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reloadUsage = useCallback(() => {
    setIsLoading(true);
    void loadUsage();
  }, [loadUsage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadUsage();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadUsage]);

  return {
    data,
    isLoading,
    errorMessage,
    reloadUsage,
  };
}
