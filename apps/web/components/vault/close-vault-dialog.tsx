"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  buildCloseVaultTransaction,
  deriveVaultPda,
} from "@workspace/anchor-client";
import { axiosInstance } from "@/lib/axios";
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
import { Separator } from "@workspace/ui/components/separator";

type CloseVaultDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed?: () => Promise<void> | void;
};

export function CloseVaultDialog({
  open,
  onOpenChange,
  onClosed,
}: CloseVaultDialogProps) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const { vaultData, reloadVaultData } = useVault();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) {
      setErrorMessage(null);
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

  const handleCloseVault = async () => {
    setErrorMessage(null);

    if (!publicKey) {
      setErrorMessage("Connect your wallet to close the vault.");
      return;
    }

    if (!signTransaction) {
      setErrorMessage("This wallet does not support transaction signing.");
      return;
    }

    if ((vaultData?.totalDeposited ?? 0) > 0) {
      setErrorMessage("Withdraw all funds before closing the vault.");
      return;
    }

    try {
      setIsSubmitting(true);

      const [vaultPda] = deriveVaultPda(publicKey);
      const tx = await buildCloseVaultTransaction({
        connection,
        ownerPublicKey: publicKey,
        vaultPublicKey: vaultPda,
      });

      tx.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;

      const signedTx = await signTransaction(tx);
      const txSignature = await connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: true }
      );

      toast.loading("Confirming vault close on-chain...");

      await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      toast.dismiss();

      await axiosInstance.post("/api/v1/vault/close", {
        txSignature,
      });

      toast.success("Vault closed successfully");
      reloadVaultData();
      await onClosed?.();
      onOpenChange(false);
    } catch (error) {
      toast.dismiss();
      setErrorMessage(
        getErrorMessage(error, "We could not close the vault right now.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Close Vault</DialogTitle>
          <DialogDescription>
            Close the vault after withdrawing all funds.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          This action will only work when the vault balance is zero.
        </div>

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
          <Button
            onClick={handleCloseVault}
            disabled={isSubmitting || (vaultData?.totalDeposited ?? 0) > 0}
          >
            {isSubmitting ? "Closing..." : "Close Vault"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
