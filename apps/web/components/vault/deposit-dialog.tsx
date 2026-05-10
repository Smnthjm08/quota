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
  buildDepositTransaction,
} from "@workspace/anchor-client";
import { axiosInstance } from "@/lib/axios";
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const parsedAmount = Number.parseFloat(amount);

    if (!amount.trim()) {
      setErrorMessage("Deposit amount is required.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Deposit amount must be a positive number.");
      return;
    }

    if (!publicKey) {
      setErrorMessage("Connect your wallet to deposit to vault.");
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
          "No vault exists for this wallet yet. Create the vault first, then deposit."
        );
        return;
      }

      // Get user's USDC token account (ATA)
      let userUsdcAccount: PublicKey;
      try {
        userUsdcAccount = getAssociatedTokenAddressSync(
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

      const userTokenAccountInfo =
        await connection.getAccountInfo(userUsdcAccount);
      if (!userTokenAccountInfo) {
        transactionInstructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            userUsdcAccount,
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

      const tx = await buildDepositTransaction({
        connection,
        ownerPublicKey: publicKey,
        vaultPublicKey: vaultPda,
        userTokenAccountPublicKey: userUsdcAccount,
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

      toast.loading("Confirming deposit on-chain...");

      await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      toast.dismiss();

      // Call API to record deposit
      await axiosInstance.post("/api/v1/vault/deposit", {
        amount: parsedAmount,
        txSignature,
      });

      toast.success(`Successfully deposited ${parsedAmount} USDC to vault`);
      reloadVaultData();
      await onDeposited?.();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.dismiss();
      setErrorMessage(
        getErrorMessage(error, "We could not process that deposit right now.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-96">
        <DialogHeader>
          <DialogTitle>Deposit to Vault</DialogTitle>
          <DialogDescription>
            Add USDC to your vault to fund agent spending limits
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Phantom may show the small network fee separately. The actual deposit
          is a USDC token transfer from your wallet to the vault.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="amount">Amount (USDC)</FieldLabel>
            <Input
              id="amount"
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

          {errorMessage && (
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
              {isSubmitting ? "Processing..." : "Deposit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
