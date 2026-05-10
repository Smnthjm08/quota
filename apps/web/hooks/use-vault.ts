"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { axiosInstance } from "@/lib/axios";
import { USDC_MINT } from "@/lib/mints";

export type VaultData = {
  totalDeposited: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type VaultResponse = {
  message: string;
  data: VaultData;
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

export function useVault() {
  const { publicKey } = useWallet();
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get user's USDC token account
  const getUserTokenAccount = useCallback((): PublicKey | null => {
    if (!publicKey) return null;
    try {
      return getAssociatedTokenAddressSync(USDC_MINT, publicKey, false);
    } catch {
      return null;
    }
  }, [publicKey]);

  // Get vault's USDC token account (vault is the owner)
  const getVaultTokenAccount = useCallback(
    (vaultPublicKey: PublicKey): PublicKey | null => {
      try {
        return getAssociatedTokenAddressSync(USDC_MINT, vaultPublicKey, true);
      } catch {
        return null;
      }
    },
    []
  );

  const loadVaultData = useCallback(async () => {
    setErrorMessage(null);

    try {
      const response = await axiosInstance.get<VaultResponse>("/api/v1/vault");
      setVaultData(response.data.data ?? null);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "We could not load vault data right now.")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reloadVaultData = useCallback(() => {
    setIsLoading(true);
    void loadVaultData();
  }, [loadVaultData]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadVaultData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadVaultData]);

  return {
    vaultData,
    isLoading,
    errorMessage,
    reloadVaultData,
    getUserTokenAccount,
    getVaultTokenAccount,
  };
}
