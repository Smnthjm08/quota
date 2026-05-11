"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";
import { deriveVaultPda } from "@workspace/anchor-client";
import { axiosInstance } from "@/lib/axios";
import { useAuthSession } from "@/hooks/use-auth-session";
import { getOnboardingRoute } from "@/lib/onboarding-route";
import { buildInitializeVaultTransaction } from "@/lib/vault-builder";

function mapCompanyPlanIdToVaultPlan(planId: number | null | undefined) {
  if (planId === 1) return 0; // free
  if (planId === 2) return 1; // starter
  if (planId === 3) return 2; // team

  return null;
}

export function useOnboardingWallet() {
  const router = useRouter();
  const { connection } = useConnection();
  const { refreshSession, session } = useAuthSession();
  const autoVerifyWalletRef = useRef<string | null>(null);
  const [isWalletSigned, setIsWalletSigned] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { connected, publicKey, signMessage, signTransaction } = useWallet();
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
        const { wallet, vaultPda, exists } = resp.data as {
          wallet: string | null;
          vaultPda: string | null;
          exists?: boolean;
        };

        if (!mounted) return;

        if (vaultPda !== null) {
          router.push("/dashboard");
          return;
        }

        if (
          connectedWallet &&
          exists &&
          (!wallet || connectedWallet !== wallet)
        ) {
          setErrorMessage(
            "This wallet is already registered. Please use a different wallet."
          );
          setIsWalletSigned(false);
          return;
        }

        if (connectedWallet && wallet && connectedWallet === wallet) {
          setIsWalletSigned(true);
          setErrorMessage("");
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

      try {
        const checkResp = await axiosInstance.get("/api/auth/wallet/check", {
          params: { wallet: connectedWallet },
        });

        const { exists, ownerId } = checkResp.data ?? {
          exists: false,
          ownerId: null,
        };

        if (exists && ownerId && ownerId !== session?.user?.id) {
          setErrorMessage(
            "This wallet is already registered to another user. Please use a different wallet."
          );
          setIsVerifying(false);
          return;
        }
      } catch (err) {
        console.warn("Wallet existence check failed; continuing", err);
      }

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
      setErrorMessage(
        apiError.response?.data?.message ?? "Verification failed"
      );
    } finally {
      setIsVerifying(false);
    }
  }, [connectedWallet, signMessage, session]);

  const retryVerification = () => {
    autoVerifyWalletRef.current = null;
    void verifyWallet();
  };

  const handleCreateVault = async () => {
    if (!connectedWallet || !publicKey) {
      setErrorMessage("Connect a wallet first");
      return;
    }

    if (!signTransaction) {
      setErrorMessage("This wallet does not support transaction signing");
      return;
    }

    if (!session?.company?.planId) {
      setErrorMessage("Plan not selected yet");
      return;
    }

    const vaultPlan = mapCompanyPlanIdToVaultPlan(session.company.planId);

    if (vaultPlan === null) {
      setErrorMessage("Unsupported plan selected for vault initialization.");
      return;
    }

    try {
      setIsCreatingVault(true);
      setErrorMessage("");

      try {
        const vaultResp = await axiosInstance.get("/api/v1/vault");
        const vaultData = vaultResp.data?.data ?? null;

        if (vaultData?.vaultPda) {
          const refreshedSession = await refreshSession();
          const nextRoute = getOnboardingRoute(
            refreshedSession?.company ?? null
          );

          if (nextRoute === "/dashboard") {
            toast.success("Vault already exists. Continuing to dashboard.");
            router.replace(nextRoute);
            return;
          }

          toast.error("Vault exists but session is still catching up.");
          return;
        }
      } catch (err) {
        // ignore API errors here and fall back to chain check below
        console.warn("Vault DB check failed, falling back to chain check", err);
      }

      const [vaultPda] = deriveVaultPda(publicKey);
      const existingVault = await connection.getAccountInfo(vaultPda);

      if (existingVault) {
        await axiosInstance.post("/api/v1/vaults", {});

        const refreshedSession = await refreshSession();
        const nextRoute = getOnboardingRoute(refreshedSession?.company ?? null);

        if (nextRoute === "/dashboard") {
          toast.success("Vault already exists. Continuing to dashboard.");
          router.replace(nextRoute);
          return;
        }

        toast.error("Vault exists but session is still catching up.");
        return;
      }

      const configResp = await axiosInstance.get("/api/config");
      const apiSignerPublicKey = new PublicKey(
        configResp.data.apiSignerPublicKey
      );

      const tx = await buildInitializeVaultTransaction({
        connection,
        ownerPublicKey: publicKey,
        apiSignerPublicKey,
        planId: vaultPlan,
      });

      tx.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;

      const signedTx = await signTransaction(tx);
      const txSignature = await connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: true }
      );

      toast.loading("Confirming transaction on chain...");

      await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      toast.dismiss();

      await axiosInstance.post("/api/v1/vaults", {
        txSignature,
      });

      const refreshedSession = await refreshSession();
      const nextRoute = getOnboardingRoute(refreshedSession?.company ?? null);

      if (nextRoute === "/dashboard") {
        toast.success("Vault created successfully. Welcome to Quota!");
        router.replace(nextRoute);
        return;
      }

      toast.error("Vault creation verification failed. Please try again.");
    } catch (error) {
      console.error("Error creating vault", error);
      const message =
        error instanceof Error ? error.message : "Failed to create vault";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsCreatingVault(false);
    }
  };

  useEffect(() => {
    if (!connectedWallet) {
      autoVerifyWalletRef.current = null;
      return;
    }

    if (errorMessage.includes("already registered")) {
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
  }, [
    connectedWallet,
    isWalletSigned,
    isVerifying,
    verifyWallet,
    errorMessage,
  ]);

  return {
    connectedWallet,
    shortWallet,
    needsVerification,
    isWalletSigned,
    isVerifying,
    isCreatingVault,
    errorMessage,
    retryVerification,
    handleCreateVault,
  };
}
