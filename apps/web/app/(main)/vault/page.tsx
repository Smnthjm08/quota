"use client";

import { VaultInfo } from "@/components/vault/vault-info";
import { VaultStats } from "@/components/vault/vault-stats";
import { VaultActions } from "@/components/vault/vault-actions";
import { useVault } from "@/hooks/use-vault";
import { Badge } from "@workspace/ui/components/badge";


export default function VaultPage() {
  const { vaultData, isLoading } = useVault();

  const vaultBalance = vaultData?.totalDeposited ?? 0;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-start justify-between px-4 lg:px-6">
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

        <div className="grid gap-4 px-4 md:grid-cols-2 lg:px-6">
          <VaultInfo />
          <VaultStats />
        </div>


      </div>

    </div>
  );
}
