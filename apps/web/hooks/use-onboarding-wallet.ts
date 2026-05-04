"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axios";

export function useOnboardingWallet() {
  const router = useRouter();
  const autoVerifyWalletRef = useRef<string | null>(null);
  const [isWalletSigned, setIsWalletSigned] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { connected, publicKey, signMessage } = useWallet();
  const connectedWallet = publicKey?.toBase58() ?? null;
  const shortWallet = connectedWallet ? `${connectedWallet}` : null;
  const needsVerification = Boolean(
    connected && connectedWallet && !isWalletSigned
  );

  useEffect(() => {
    let mounted = true;

    async function checkWalletStatus() {
      try {
        const resp = await axiosInstance.get("/api/auth/wallet/status");
        const { wallet, vaultPda } = resp.data as {
          wallet: string | null;
          vaultPda: string | null;
        };

        if (!mounted) return;

        if (vaultPda !== null) {
          router.push("/dashboard");
          return;
        }

        if (connectedWallet && wallet && connectedWallet === wallet) {
          setIsWalletSigned(true);
        } else {
          setIsWalletSigned(false);
          setErrorMessage("");
        }
      } catch (error) {
        console.error("Failed to fetch wallet status", error);
      }
    }

    void checkWalletStatus();

    return () => {
      mounted = false;
    };
  }, [connectedWallet, router]);

  const verifyWallet = useCallback(async () => {
    if (!connectedWallet) {
      setErrorMessage("Connect a wallet first");
      return;
    }

    if (!signMessage) {
      setErrorMessage("This wallet does not support message signing");
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage("");

      const challengeResp = await axiosInstance.post(
        "/api/auth/wallet/challenge",
        {
          wallet: connectedWallet,
        }
      );

      const { nonce, message } = challengeResp.data.data as {
        nonce: string;
        message: string;
      };

      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);

      await axiosInstance.post("/api/auth/wallet/verify", {
        wallet: connectedWallet,
        nonce,
        signature: Array.from(signature),
      });

      setIsWalletSigned(true);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      const apiError = error as AxiosError<{ message?: string }>;
      setErrorMessage(apiError.response?.data?.message ?? "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  }, [connectedWallet, signMessage]);

  const retryVerification = () => {
    autoVerifyWalletRef.current = null;
    void verifyWallet();
  };

  const handleCreateVault = async () => {
    try {
      await axiosInstance.post("/api/v1/vaults", {
        hello: "ssssss",
      });
      toast.success("====");
    } catch (error) {
      console.error("Error creating vault", error);
      toast.error("Failed to Create vault. Please try after sometime.");
    }
  };

  useEffect(() => {
    if (!connectedWallet) {
      autoVerifyWalletRef.current = null;
      return;
    }

    if (isWalletSigned || isVerifying) {
      return;
    }

    if (autoVerifyWalletRef.current === connectedWallet) {
      return;
    }

    autoVerifyWalletRef.current = connectedWallet;
    void verifyWallet();
  }, [connectedWallet, isWalletSigned, isVerifying, verifyWallet]);

  return {
    connectedWallet,
    shortWallet,
    needsVerification,
    isWalletSigned,
    isVerifying,
    errorMessage,
    retryVerification,
    handleCreateVault,
  };
}