"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { axiosInstance } from "@/lib/axios";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function WalletConnectPage() {
  const [mounted, setMounted] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isWalletSigned, setIsWalletSigned] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { connected, publicKey, signMessage } = useWallet();

  useEffect(() => {
    if (connected && publicKey && !isWalletSigned) {
      setNeedsVerification(true);
    }
  }, [connected, publicKey, isWalletSigned]);

  // Check server-side wallet association when wallet or session changes
  useEffect(() => {
    let mounted = true;

    async function checkWalletStatus() {
      try {
        const resp = await axiosInstance.get("/api/auth/wallet/status");
        const { wallet } = resp.data as { wallet: string | null };

        if (!mounted) return;

        if (publicKey && wallet && publicKey.toBase58() === wallet) {
          setIsWalletSigned(true);
          setNeedsVerification(false);
        } else if (publicKey && (!wallet || publicKey.toBase58() !== wallet)) {
          setIsWalletSigned(false);
          setNeedsVerification(true);
        } else {
          setIsWalletSigned(false);
        }
      } catch (e) {
        console.error("Failed to fetch wallet status", e);
      }
    }

    checkWalletStatus();

    return () => {
      mounted = false;
    };
  }, [publicKey, connected]);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function verifyWallet() {
    if (!publicKey || !signMessage) return;

    const nonce = crypto.randomUUID();

    const message = new TextEncoder().encode(
      `Verify wallet ownership for Quota\nNonce:${nonce}`
    );

    try {
      const signature = await signMessage(message);

      setIsVerifying(true);
      setErrorMessage("");

      await axiosInstance.post("/api/auth/wallet/verify", {
        wallet: publicKey.toBase58(),
        nonce,
        signature: Array.from(signature),
      });

      setIsWalletSigned(true);
      setNeedsVerification(false);
    } catch (e) {
      console.error(e);
      setErrorMessage(
        (e as any)?.response?.data?.message ?? "Verification failed"
      );
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <main>
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">Connect your wallet</h1>

        {mounted && <WalletMultiButton />}

        {needsVerification && (
          <div className="flex items-center gap-3">
            <button
              onClick={verifyWallet}
              disabled={isVerifying}
              className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50"
            >
              {isVerifying ? "Verifying…" : "Verify Wallet"}
            </button>
            {errorMessage && (
              <span className="text-sm text-destructive">{errorMessage}</span>
            )}
          </div>
        )}

        {isWalletSigned && (
          <button className="rounded-md border px-3 py-1 text-sm">
            Create Vault
          </button>
        )}
      </div>
    </main>
  );
}
