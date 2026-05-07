"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { deriveVaultPda } from "@workspace/anchor-client";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import {
  buildUpdateSeatTransaction,
  type BuildUpdateSeatTxParams,
} from "@/lib/seat-builder";
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
import { type SeatRecord } from "@/hooks/use-seats";

type EditSeatDialogProps = {
  seat: SeatRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => Promise<void> | void;
};

export function EditSeatDialog({
  seat,
  open,
  onOpenChange,
  onUpdated,
}: EditSeatDialogProps) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [newLimit, setNewLimit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setNewLimit("");
    setErrorMessage(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) {
      resetForm();
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!seat) {
      setErrorMessage("No seat selected");
      return;
    }

    const parsedNewLimit = Number.parseInt(newLimit, 10);

    if (!Number.isInteger(parsedNewLimit) || parsedNewLimit <= 0) {
      setErrorMessage("Monthly limit must be a positive integer");
      return;
    }

    if (parsedNewLimit === seat.monthlyLimit) {
      setErrorMessage("New limit must be different from current limit");
      return;
    }

    if (parsedNewLimit < seat.consumed) {
      setErrorMessage(
        "New limit cannot be less than the already consumed amount"
      );
      return;
    }

    if (!publicKey) {
      setErrorMessage("Connect your wallet to update this seat");
      return;
    }

    if (!signTransaction) {
      setErrorMessage("This wallet does not support transaction signing");
      return;
    }

    try {
      setIsSubmitting(true);

      const seatPublicKey = new PublicKey(seat.seatPda);
      const [vaultPublicKey] = deriveVaultPda(publicKey);

      const tx = await buildUpdateSeatTransaction({
        connection,
        ownerPublicKey: publicKey,
        vaultPublicKey,
        seatPublicKey,
        newLimit: parsedNewLimit,
      } satisfies BuildUpdateSeatTxParams);

      tx.feePayer = publicKey;

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;

      const signedTx = await signTransaction(tx);
      const txSignature = await connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: true }
      );

      toast.loading("Updating seat limit on-chain...");

      await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      toast.dismiss();

      await axiosInstance.patch<{ data: SeatRecord }>(
        `/api/v1/seats/${seat.id}/update-limit`,
        {
          txSignature,
          newLimit: parsedNewLimit,
        }
      );

      toast.success("Seat limit updated successfully");
      resetForm();
      handleOpenChange(false);
      await onUpdated?.();
    } catch (error) {
      toast.dismiss();
      console.error("Error updating seat limit:", error);
      setErrorMessage("Failed to update seat limit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Seat Limit</DialogTitle>
          <DialogDescription>
            Update the monthly credit limit for {seat?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Current limit:</span>
              <span className="ml-2 text-muted-foreground">
                {seat?.monthlyLimit.toLocaleString() || "—"}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Already consumed:</span>
              <span className="ml-2 text-muted-foreground">
                {seat?.consumed.toLocaleString() || "—"}
              </span>
            </div>
          </div>

          <Field>
            <FieldLabel htmlFor="new-limit">New Monthly Limit</FieldLabel>
            <Input
              id="new-limit"
              type="number"
              placeholder="e.g., 5000"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </Field>

          {errorMessage && (
            <div className="text-sm text-destructive">{errorMessage}</div>
          )}

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
              {isSubmitting && (
                <Loader2Icon className="mr-2 animate-spin" size={16} />
              )}
              {isSubmitting ? "Updating..." : "Update Limit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
