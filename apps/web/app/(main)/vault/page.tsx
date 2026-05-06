"use client";

import { useState } from "react";
import { VaultInfo } from "@/components/vault/vault-info";
import { VaultStats } from "@/components/vault/vault-stats";
import { VaultActions } from "@/components/vault/vault-actions";
import { CloseVaultDialog } from "@/components/vault/close-vault-dialog";
import { useVault } from "@/hooks/use-vault";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { XCircle } from "lucide-react";

export default function VaultPage() {
  const { vaultData, isLoading } = useVault();
  const [closeOpen, setCloseOpen] = useState(false);

  const vaultBalance = vaultData?.totalDeposited ?? 0;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vault</h1>
            <p className="text-muted-foreground">
              Manage your vault and linked wallet
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Vault balance</span>
              <Badge variant="outline" className="font-medium">
                {isLoading ? "Loading..." : `${vaultBalance.toFixed(2)} USDC`}
              </Badge>
            </div>
          </div>
          <VaultActions />
        </div>
        
        <div className="px-4 lg:px-6 grid gap-4 md:grid-cols-2">
          <VaultInfo />
          <VaultStats />
        </div>

        <div className="px-4 lg:px-6">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Closing the vault is separate from withdrawing funds. Withdraw the balance first, then close only when the vault is inactive.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button
                variant="destructive"
                onClick={() => setCloseOpen(true)}
                className="cursor-pointer"
              >
                <XCircle className="mr-2 size-4" />
                Close Vault
              </Button>
              <span className="text-sm text-muted-foreground">
                This is intentionally separated from deposit and withdraw actions.
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      <CloseVaultDialog open={closeOpen} onOpenChange={setCloseOpen} />
    </div>
  );
}
