"use client";

import { useFiatTopupCheckout } from "@/hooks/use-fiat-topup-checkout";
import { Separator } from "@workspace/ui/components/separator";
import { CreditCard, Loader2 } from "lucide-react";

interface FiatTopupTabProps {
  onCheckoutStarted?: () => void;
  onError?: (error: string) => void;
}

export function FiatTopupTab({
  onCheckoutStarted,
  onError,
}: FiatTopupTabProps) {
  const { topupPlans, isLoadingPlans, isLoading, error, createCheckout } =
    useFiatTopupCheckout();

  const handleSelectPlan = async (planId: number) => {
    try {
      onCheckoutStarted?.();
      await createCheckout(planId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create checkout";
      onError?.(errorMessage);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
        <span className="font-semibold">Fiat Payment:</span> Top up your vault
        using your credit card or crypto. Funds are instantly converted to USDC
        and added to your vault.
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Separator />

      {isLoadingPlans ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading topup options...
          </span>
        </div>
      ) : topupPlans.length === 0 ? (
        <div className="rounded-md bg-muted p-3 text-center text-sm text-muted-foreground">
          No topup plans available
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {topupPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              disabled={isLoading}
              className="group relative flex items-center justify-between rounded-lg border border-border p-3 text-left transition-all hover:border-primary hover:bg-accent disabled:opacity-50"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-muted-foreground group-hover:text-primary" />
                  <span className="text-sm font-medium">{plan.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {plan.currency} {(plan.priceCents / 100).toFixed(2)}
                </span>
              </div>
              {isLoading ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-xs font-semibold text-primary group-hover:block">
                  →
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2 pt-2 text-xs text-muted-foreground">
        <p>
          <span className="font-semibold">How it works:</span>
        </p>
        <ol className="list-inside list-decimal space-y-1">
          <li>Select a topup amount</li>
          <li>Complete payment securely via Dodo Payments</li>
          <li>Funds are automatically converted to USDC</li>
          <li>Your vault balance is instantly updated</li>
        </ol>
      </div>
    </div>
  );
}
