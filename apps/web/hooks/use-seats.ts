"use client";

import { useCallback, useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";

export type SeatType = "HUMAN" | "AGENT";

export type SeatRecord = {
  id: string;
  name: string;
  seatType: SeatType;
  holderPubkey: string;
  seatPda: string;
  monthlyLimit: number;
  consumed: number;
  createdAt: string;
  updatedAt: string;
  lastSpendAt: string | null;
};

type SeatsResponse = {
  message: string;
  data: SeatRecord[];
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

export function useSeats() {
  const [seats, setSeats] = useState<SeatRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSeats = useCallback(async () => {
    setErrorMessage(null);

    try {
      const response = await axiosInstance.get<SeatsResponse>("/api/v1/seats");
      setSeats(response.data.data ?? []);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "We could not load seats right now.")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reloadSeats = useCallback(() => {
    setIsLoading(true);
    void loadSeats();
  }, [loadSeats]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSeats();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadSeats]);

  return {
    seats,
    isLoading,
    errorMessage,
    reloadSeats,
  };
}
