"use client";

import dynamic from "next/dynamic";
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
import { useOnboardingWallet } from "@/hooks/use-onboarding-wallet";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function WalletConnectPage() {
  const {
    connectedWallet,
    shortWallet,
    needsVerification,
    isWalletSigned,
    isVerifying,
    errorMessage,
    retryVerification,
    handleCreateVault,
  } = useOnboardingWallet();

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
                  onClick={retryVerification}
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
