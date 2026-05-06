"use client";

import { useAuthSession } from "@/hooks/use-auth-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

export function VaultInfo() {
  const { company } = useAuthSession();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const walletAddress = company?.ownerWalletPubkey;
  const vaultPda = company?.vaultPda;

  const isLinked = walletAddress && vaultPda;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Vault Connection
          {isLinked ? (
            <Badge variant="outline" className="ml-auto">
              <CheckCircle2 className="size-3 mr-1" />
              Linked
            </Badge>
          ) : (
            <Badge variant="destructive" className="ml-auto">
              <AlertCircle className="size-3 mr-1" />
              Not Linked
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Your wallet is {isLinked ? "connected" : "not connected"} to a vault
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Linked Wallet
          </label>
          {walletAddress ? (
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-md">
              <code className="text-sm font-mono flex-1 truncate">
                {walletAddress}
              </code>
              <button
                onClick={() => copyToClipboard(walletAddress, "wallet")}
                className="p-1 hover:bg-primary/10 rounded transition-colors"
                title="Copy wallet address"
              >
                {copied === "wallet" ? (
                  <CheckCircle2 className="size-4 text-green-600" />
                ) : (
                  <Copy className="size-4 text-muted-foreground" />
                )}
              </button>
            </div>
          ) : (
            <div className="p-3 bg-destructive/10 rounded-md text-sm text-destructive">
              No wallet connected
            </div>
          )}
        </div>

        {/* Vault PDA */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Vault PDA
          </label>
          {vaultPda ? (
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-md">
              <code className="text-sm font-mono flex-1 truncate">
                {vaultPda}
              </code>
              <button
                onClick={() => copyToClipboard(vaultPda, "vault")}
                className="p-1 hover:bg-primary/10 rounded transition-colors"
                title="Copy vault PDA"
              >
                {copied === "vault" ? (
                  <CheckCircle2 className="size-4 text-green-600" />
                ) : (
                  <Copy className="size-4 text-muted-foreground" />
                )}
              </button>
            </div>
          ) : (
            <div className="p-3 bg-destructive/10 rounded-md text-sm text-destructive">
              No vault initialized
            </div>
          )}
        </div>

        {/* Company Info */}
        <div className="space-y-2 pt-2 border-t">
          <label className="text-sm font-medium text-muted-foreground">
            Company
          </label>
          <div className="p-3 bg-secondary rounded-md">
            <p className="text-sm font-medium">{company?.name || "Unknown"}</p>
            {company?.plan && (
              <p className="text-xs text-muted-foreground mt-1">
                Plan: <Badge variant="outline">{company.plan.name}</Badge>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
