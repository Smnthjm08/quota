"use client";

import { useMemo, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { deriveVaultPda } from "@workspace/anchor-client";
import { axiosInstance } from "@/lib/axios";
import { buildCreateSeatTransaction } from "@/lib/seat-builder";
import { useSeats } from "@/hooks/use-seats";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import { type SeatRecord, type SeatType } from "@/hooks/use-seats";

type SeatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (seat: SeatRecord) => Promise<void> | void;
};

const seatTypeOptions: { value: SeatType; label: string }[] = [
  { value: "HUMAN", label: "Human" },
  { value: "AGENT", label: "Agent" },
];

function seatTypeToProgramValue(seatType: SeatType) {
  // On-chain enum: 1 = HUMAN, 2 = AGENT
  return seatType === "HUMAN" ? 1 : 2;
}

function generateSeatId(): bigint {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);

  let seatId = 0n;
  for (const [index, byte] of bytes.entries()) {
    seatId |= BigInt(byte) << BigInt(index * 8);
  }

  return seatId === 0n ? 1n : seatId;
}

export function SeatDialog({ open, onOpenChange, onCreated }: SeatDialogProps) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const { vaultData } = useVault();
  const { seats } = useSeats();
  const [name, setName] = useState("");
  const [holderPubkey, setHolderPubkey] = useState("");
  const [seatType, setSeatType] = useState<SeatType>("HUMAN");
  const [monthlyLimit, setMonthlyLimit] = useState("1000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [vaultAllocation, setVaultAllocation] = useState<{
    totalDeposited: number;
    totalAssigned: number;
    availableBalance: number;
  } | null>(null);

  const liveVaultBalance = vaultData?.totalDeposited ?? 0;
  const liveUsedBalance = useMemo(
    () => seats.reduce((total, seat) => total + seat.monthlyLimit, 0),
    [seats]
  );
  const liveAvailableBalance = Math.max(liveVaultBalance - liveUsedBalance, 0);

  const resetForm = () => {
    setName("");
    setHolderPubkey("");
    setSeatType("HUMAN");
    setMonthlyLimit("1000");
    setErrorMessage(null);
    setVaultAllocation(null);
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

    const parsedMonthlyLimit = Number.parseInt(monthlyLimit, 10);

    if (!name.trim() || !holderPubkey.trim()) {
      setErrorMessage("Name and holder public key are required.");
      return;
    }

    if (!Number.isInteger(parsedMonthlyLimit) || parsedMonthlyLimit <= 0) {
      setErrorMessage("Monthly limit must be a positive integer.");
      return;
    }

    if (parsedMonthlyLimit > liveAvailableBalance) {
      setErrorMessage(
        `Insufficient vault funds. Available balance is ${liveAvailableBalance.toFixed(2)} USDC, but this seat needs ${parsedMonthlyLimit.toFixed(2)} USDC.`
      );
      return;
    }

    if (!publicKey) {
      setErrorMessage("Connect your wallet to create a seat on-chain.");
      return;
    }

    if (!signTransaction) {
      setErrorMessage("This wallet does not support transaction signing.");
      return;
    }

    let holderPublicKey: PublicKey;

    try {
      holderPublicKey = new PublicKey(holderPubkey.trim());
    } catch {
      setErrorMessage("Holder public key is invalid.");
      return;
    }

    try {
      setIsSubmitting(true);
      const seatId = generateSeatId();
      const [vaultPda] = deriveVaultPda(publicKey);

      const result = await buildCreateSeatTransaction({
        connection,
        ownerPublicKey: publicKey,
        vaultPublicKey: vaultPda,
        holderPublicKey,
        seatId,
        seatType: seatTypeToProgramValue(seatType),
        monthlyLimit: parsedMonthlyLimit,
      });

      // Store and display vault allocation info
      setVaultAllocation({
        totalDeposited: result.vaultAllocation.totalDepositedHuman,
        totalAssigned: result.vaultAllocation.totalAssignedHuman,
        availableBalance: result.vaultAllocation.availableBalanceHuman,
      });

      const tx = result.transaction;

      tx.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;

      const signedTx = await signTransaction(tx);
      const txSignature = await connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: true }
      );

      toast.loading("Confirming seat creation on-chain...");

      await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      toast.dismiss();

      const response = await axiosInstance.post<{ data: SeatRecord }>(
        "/api/v1/seats",
        {
          name: name.trim(),
          holderPubkey: holderPubkey.trim(),
          seatType,
          monthlyLimit: parsedMonthlyLimit,
          seatId: seatId.toString(),
          txSignature,
        }
      );

      const createdSeat = response.data.data;
      toast.success("Seat created successfully");
      await onCreated?.(createdSeat);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.dismiss();
      setErrorMessage(
        getErrorMessage(error, "We could not create that seat right now.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create seat</DialogTitle>
          <DialogDescription>
            Add a new team seat and let the backend derive the seat PDA from the
            company vault automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Deposited</p>
            <p className="font-semibold">{liveVaultBalance.toFixed(2)} USDC</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Used</p>
            <p className="font-semibold">{liveUsedBalance.toFixed(2)} USDC</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="font-semibold text-emerald-600">
              {liveAvailableBalance.toFixed(2)} USDC
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="gap-2 sm:col-span-2">
              <FieldLabel htmlFor="seat-name">Seat name</FieldLabel>
              <Input
                id="seat-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Engineering seat"
                required
              />
            </Field>

            <Field className="gap-2 sm:col-span-2">
              <FieldLabel htmlFor="holder-pubkey">Holder public key</FieldLabel>
              <Input
                id="holder-pubkey"
                value={holderPubkey}
                onChange={(event) => setHolderPubkey(event.target.value)}
                placeholder="Enter a Solana wallet address"
                required
              />
            </Field>

            <Field className="gap-2">
              <FieldLabel htmlFor="seat-type">Seat type</FieldLabel>
              <Select
                value={seatType}
                onValueChange={(value) => setSeatType(value as SeatType)}
              >
                <SelectTrigger id="seat-type">
                  <SelectValue placeholder="Select seat type" />
                </SelectTrigger>
                <SelectContent>
                  {seatTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="gap-2">
              <FieldLabel htmlFor="monthly-limit">Monthly limit</FieldLabel>
              <Input
                id="monthly-limit"
                type="number"
                min={1}
                step={1}
                value={monthlyLimit}
                onChange={(event) => setMonthlyLimit(event.target.value)}
                placeholder="1000"
                required
              />
            </Field>
          </div>

          <Separator />

          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            The form checks vault availability before building the transaction,
            and the backend still enforces the same limit on submission.
          </div>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

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
              {isSubmitting ? "Creating..." : "Create seat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
