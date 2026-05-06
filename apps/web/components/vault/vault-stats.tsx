"use client";

import { useMemo } from "react";
import { useSeats } from "@/hooks/use-seats";
import { useVault } from "@/hooks/use-vault";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";

export function VaultStats() {
  const { seats } = useSeats();
  const { vaultData } = useVault();

  const vaultBalance = useMemo(() => {
    return vaultData?.totalDeposited ?? 0;
  }, [vaultData?.totalDeposited]);

  const lastUpdated = vaultData?.updatedAt
    ? new Date(vaultData.updatedAt).toLocaleString()
    : "Never";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vault Stats</CardTitle>
        <CardDescription>
          Overview of your vault activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Active Seats */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Active Seats
            </p>
            <p className="text-2xl font-bold">{seats.length}</p>
            <Badge variant="outline" className="text-xs">
              Initialized
            </Badge>
          </div>

          {/* Vault Balance */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Vault Balance
            </p>
            <p className="text-2xl font-bold">{vaultBalance.toFixed(2)} USDC</p>
            <Badge variant="outline" className="text-xs">
              On-chain
            </Badge>
          </div>
        </div>

        <div className="pt-4 border-t space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Total Seats Created
            </span>
            <span className="font-semibold">{seats.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Last Updated
            </span>
            <span className="text-sm text-muted-foreground">
              {lastUpdated}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
