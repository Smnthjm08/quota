"use client";

import { useMemo } from "react";
import { VaultInfo } from "@/components/vault/vault-info";
import { VaultStats } from "@/components/vault/vault-stats";
import { VaultActions } from "@/components/vault/vault-actions";
import { useVault } from "@/hooks/use-vault";
import { useSeats } from "@/hooks/use-seats";
import { Badge } from "@workspace/ui/components/badge";


export default function VaultPage() {
  const { vaultData, isLoading, reloadVaultData } = useVault();
  const { seats, reloadSeats } = useSeats();

  const vaultBalance = vaultData?.totalDeposited ?? 0;
  const usedBalance = useMemo(
    () => seats.reduce((total, seat) => total + seat.monthlyLimit, 0),
    [seats]
  );
  const availableBalance = Math.max(vaultBalance - usedBalance, 0);

  const refreshVaultState = async () => {
    await Promise.all([reloadVaultData(), reloadSeats()]);
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-start justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vault</h1>
            <p className="text-muted-foreground">
              Manage your vault and linked wallet
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Deposited</p>
                <p className="text-sm font-semibold">
                  {isLoading ? "Loading..." : `${vaultBalance.toFixed(2)} USDC`}
                </p>
              </div>
              <div className="rounded-lg border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Used</p>
                <p className="text-sm font-semibold">
                  {isLoading ? "Loading..." : `${usedBalance.toFixed(2)} USDC`}
                </p>
              </div>
              <div className="rounded-lg border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-sm font-semibold text-emerald-600">
                  {isLoading ? "Loading..." : `${availableBalance.toFixed(2)} USDC`}
                </p>
              </div>
            </div>
          </div>
          <VaultActions onDeposited={refreshVaultState} />
        </div>

        <div className="grid gap-4 px-4 md:grid-cols-2 lg:px-6">
          <VaultInfo />
          <VaultStats />
        </div>


      </div>

    </div>
  );
}
