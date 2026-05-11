"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  deriveVaultPda,
  // buildDepositTransaction,
  buildTopupTransaction,
} from "@workspace/anchor-client";
// import { axiosInstance } from "@/lib/axios";
import { USDC_MINT } from "@/lib/mints";
import { useVault } from "@/hooks/use-vault";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { FiatTopupTab } from "./fiat-topup-tab";

type DepositDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeposited?: () => Promise<void> | void;
};

export function DepositDialog({
  open,
  onOpenChange,
  onDeposited,
}: DepositDialogProps) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const { getVaultTokenAccount, reloadVaultData } = useVault();

  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"topup" | "fiat">("topup");

  const resetForm = () => {
    setAmount("");
    setErrorMessage(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;

      return (
        axiosError.response?.data?.message ??
        axiosError.response?.data?.error ??
        axiosError.message ??
        fallback
      );
    }

    return fallback;
  };

  const handleTopupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const parsedAmount = Number.parseFloat(amount);

    if (!amount.trim()) {
      setErrorMessage("Top up amount is required.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Top up amount must be a positive number.");
      return;
    }

    if (!publicKey) {
      setErrorMessage("Connect your wallet to top up vault.");
      return;
    }

    if (!signTransaction) {
      setErrorMessage("This wallet does not support transaction signing.");
      return;
    }

    try {
      setIsSubmitting(true);

      const [vaultPda] = deriveVaultPda(publicKey);
      const vaultAccount = await connection.getAccountInfo(vaultPda);

      if (!vaultAccount) {
        setErrorMessage(
          "No vault exists for this wallet yet. Create the vault first, then top up."
        );
        return;
      }

      // Get owner's USDC token account (ATA)
      let ownerUsdcAccount: PublicKey;
      try {
        ownerUsdcAccount = getAssociatedTokenAddressSync(
          USDC_MINT,
          publicKey,
          false
        );
      } catch {
        throw new Error("Could not derive your USDC token account.");
      }

      // Get vault's USDC token account
      const vaultUsdcAccount = getVaultTokenAccount(vaultPda);
      if (!vaultUsdcAccount) {
        throw new Error("Could not derive vault USDC token account.");
      }

      const transactionInstructions = [];

      const ownerTokenAccountInfo =
        await connection.getAccountInfo(ownerUsdcAccount);
      if (!ownerTokenAccountInfo) {
        transactionInstructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            ownerUsdcAccount,
            publicKey,
            USDC_MINT,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      const vaultTokenAccountInfo =
        await connection.getAccountInfo(vaultUsdcAccount);
      if (!vaultTokenAccountInfo) {
        transactionInstructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            vaultUsdcAccount,
            vaultPda,
            USDC_MINT,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      // Convert amount to lamports (6 decimals for USDC)
      const amountInLamports = Math.floor(parsedAmount * 1_000_000);

      const tx = await buildTopupTransaction({
        connection,
        vaultOwnerPublicKey: publicKey,
        vaultPublicKey: vaultPda,
        mintPublicKey: USDC_MINT,
        ownerTokenAccountPublicKey: ownerUsdcAccount,
        vaultTokenAccountPublicKey: vaultUsdcAccount,
        amount: amountInLamports,
      });

      if (transactionInstructions.length > 0) {
        tx.instructions.unshift(...transactionInstructions);
      }

      tx.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;

      const signedTx = await signTransaction(tx);
      const txSignature = await connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: true }
      );

      toast.loading("Confirming top up on-chain...");

      await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      toast.dismiss();
      toast.success(`Successfully topped up vault with ${parsedAmount} USDC`);
      reloadVaultData();
      await onDeposited?.();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.dismiss();
      setErrorMessage(
        getErrorMessage(error, "We could not process that top up right now.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-96">
        <DialogHeader>
          <DialogTitle>Fund Your Vault</DialogTitle>
          <DialogDescription>
            Add USDC to your vault to fund agent spending limits
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "topup" | "fiat")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topup">Quick Top Up</TabsTrigger>
            <TabsTrigger value="fiat">Fiat Top Up</TabsTrigger>
          </TabsList>

          <TabsContent value="topup" className="space-y-4">
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              <span className="font-semibold">Direct Top Up:</span> Transfer USDC directly from your wallet to fund
              the vault instantly. No API needed.
            </div>

            <form onSubmit={handleTopupSubmit} className="space-y-4">
              <Field>
                <FieldLabel htmlFor="amount-topup">Amount (USDC)</FieldLabel>
                <Input
                  id="amount-topup"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  disabled={isSubmitting}
                  required
                />
              </Field>

              {errorMessage && activeTab === "topup" && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}

              <Separator />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Top Up Vault"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="fiat" className="space-y-4">
            <FiatTopupTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
