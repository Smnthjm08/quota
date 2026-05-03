"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import OnboardingRouteGuard from "@/components/onboarding/onboarding-route-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function WalletConnectPage() {
  const [isWalletSigned, setIsWalletSigned] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const autoVerifyWalletRef = useRef<string | null>(null);
  const router = useRouter();

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

        const hasVaultPda = vaultPda !== null;
        // typeof vaultPda === "string" && vaultPda.trim().length > 0;

        if (hasVaultPda) {
          router.push("/dashboard");
          return;
        }

        if (connectedWallet && wallet && connectedWallet === wallet) {
          setIsWalletSigned(true);
        } else if (connectedWallet && (!wallet || connectedWallet !== wallet)) {
          setIsWalletSigned(false);
          setErrorMessage("");
        } else {
          setIsWalletSigned(false);
          setErrorMessage("");
        }
      } catch (e) {
        console.error("Failed to fetch wallet status", e);
      }
    }

    checkWalletStatus();

    return () => {
      mounted = false;
    };
  }, [connectedWallet, connected, router]);

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
    } catch (e) {
      console.error(e);
      const apiError = e as AxiosError<{ message?: string }>;
      setErrorMessage(
        apiError.response?.data?.message ?? "Verification failed"
      );
    } finally {
      setIsVerifying(false);
    }
  }, [connectedWallet, signMessage]);

  const handleCreateVault = async () => {
    try {
      console.log("=========");
      const data = await axiosInstance.post("/api/v1/vaults", {
        hello: "ssssss",
      });
      console.log("data", data);
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

  return (
    <>
      <OnboardingRouteGuard />
      <main className="mx-auto w-full max-w-xl items-center justify-between px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Connect your wallet</CardTitle>
                <CardDescription>
                  Connect and verify your wallet before creating a vault.
                </CardDescription>
              </div>
              <Badge variant={isWalletSigned ? "default" : "secondary"}>
                {isWalletSigned
                  ? "Verified"
                  : connectedWallet
                    ? "Connected"
                    : "Not connected"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">Wallet</div>
              <div className="mt-1 font-mono text-sm">
                {shortWallet ?? "No wallet connected"}
              </div>
            </div>

            <div>
              <WalletMultiButton />
            </div>

            {needsVerification && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  {isVerifying
                    ? "Requesting signature..."
                    : "Verifying wallet after connection"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your wallet will sign a one-time message automatically.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-3">
                <p className="text-sm text-destructive">{errorMessage}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    autoVerifyWalletRef.current = null;
                    void verifyWallet();
                  }}
                  disabled={isVerifying || !connectedWallet}
                >
                  Retry
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="justify-end">
            <div className="flex gap-2">
              <Button
                variant="default"
                type="button"
                className="cursor-pointer"
                size={"lg"}
                disabled={!isWalletSigned}
                onClick={handleCreateVault}
              >
                Create Vault
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
