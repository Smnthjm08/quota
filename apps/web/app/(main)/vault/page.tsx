"use client";

import { VaultInfo } from "@/components/vault/vault-info";
import { VaultStats } from "@/components/vault/vault-stats";
import { VaultActions } from "@/components/vault/vault-actions";
import { useUsage } from "@/hooks/use-usage";

const usdcFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatUsdc(value: number) {
  return `${usdcFormatter.format(value)} USDC`;
}

export default function VaultPage() {
  const { data: usageData, isLoading, reloadUsage } = useUsage();

  const vaultBalance = usageData?.summary.totalDeposited ?? 0;
  const usedBalance = usageData?.summary.usedBalance ?? 0;
  const availableBalance = usageData?.summary.availableBalance ?? 0;

  const refreshVaultState = async () => {
    await reloadUsage();
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
                  {isLoading ? "Loading..." : formatUsdc(vaultBalance)}
                </p>
              </div>
              <div className="rounded-lg border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  Allocated to seats
                </p>
                <p className="text-sm font-semibold">
                  {isLoading ? "Loading..." : formatUsdc(usedBalance)}
                </p>
              </div>
              <div className="rounded-lg border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-sm font-semibold text-emerald-600">
                  {isLoading ? "Loading..." : formatUsdc(availableBalance)}
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
