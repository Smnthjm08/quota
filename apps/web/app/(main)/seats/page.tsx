"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  Loader2Icon,
  PlusCircleIcon,
  RefreshCcwIcon,
  MoreVerticalIcon,
} from "lucide-react";
import { deriveVaultPda } from "@workspace/anchor-client";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { SeatDialog } from "@/components/seats/seat-dialog";
import { EditSeatDialog } from "@/components/seats/edit-seat-dialog";
import { PaginatedTable } from "@/components/paginated-table";
import { axiosInstance } from "@/lib/axios";
import {
  buildToggleSeatTransaction,
  type BuildToggleSeatTxParams,
} from "@/lib/seat-builder";
import { type SeatRecord, useSeats } from "@/hooks/use-seats";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function seatTypeLabel(seatType: SeatRecord["seatType"]) {
  return seatType === "HUMAN" ? "Human" : "Agent";
}

function seatStatusLabel(active: boolean) {
  return active ? "Active" : "Inactive";
}

function SeatRowActions({
  seat,
  onToggled,
  onEditClick,
}: {
  seat: SeatRecord;
  onToggled: () => Promise<void> | void;
  onEditClick: (seat: SeatRecord) => void;
}) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = async () => {
    if (!publicKey) {
      toast.error("Connect your wallet to toggle a seat.");
      return;
    }

    if (!signTransaction) {
      toast.error("This wallet does not support transaction signing.");
      return;
    }

    try {
      setIsSubmitting(true);

      const seatPublicKey = new PublicKey(seat.seatPda);
      const [vaultPublicKey] = deriveVaultPda(publicKey);

      const tx = await buildToggleSeatTransaction({
        connection,
        ownerPublicKey: publicKey,
        vaultPublicKey,
        seatPublicKey,
      } satisfies BuildToggleSeatTxParams);

      tx.feePayer = publicKey;

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;

      const signedTx = await signTransaction(tx);
      const txSignature = await connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: true }
      );

      toast.loading(
        `${seat.active ? "Deactivating" : "Activating"} seat on-chain...`
      );

      await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      toast.dismiss();

      await axiosInstance.patch<{ data: SeatRecord }>(
        `/api/v1/seats/${seat.id}/toggle`,
        {
          txSignature,
        }
      );

      toast.success(
        `Seat ${seat.active ? "deactivated" : "activated"} successfully`
      );
      await onToggled();
    } catch (error) {
      toast.dismiss();
      console.error("Error toggling seat:", error);
      toast.error("We could not toggle that seat right now.");
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
            className="h-8 w-8 p-0"
          >
            <MoreVerticalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEditClick(seat)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowConfirm(true)}>
            {seat.active ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {seat.active ? "Deactivate" : "Activate"} seat?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {seat.active
                ? `Are you sure you want to deactivate "${seat.name}"? This seat will no longer be able to access your vault.`
                : `Are you sure you want to activate "${seat.name}"? This action will be recorded on-chain.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                (seat.active ? "Deactivate" : "Activate")
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function SeatsPage() {
  const { seats, isLoading, errorMessage, reloadSeats } = useSeats();
  const [isCreateSeatOpen, setIsCreateSeatOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<SeatRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Seats</h1>
            <p className="text-sm text-muted-foreground">
              Manage team access and monthly limits from one place.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={reloadSeats}
              disabled={isLoading}
            >
              <RefreshCcwIcon className={isLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateSeatOpen(true)}>
              <PlusCircleIcon />
              Add seat
            </Button>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <PaginatedTable
          data={seats}
          initialPageSize={10}
          pageSizeOptions={[10, 20, 30, 40, 50]}
        >
          {({ pageItems, startIndex }) => (
            <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Holder wallet</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Monthly limit</TableHead>
                    <TableHead>Seat PDA</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        Loading seats...
                      </TableCell>
                    </TableRow>
                  ) : pageItems.length > 0 ? (
                    pageItems.map((seat, index) => (
                      <TableRow key={seat.id}>
                        <TableCell>{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium">{seat.name}</TableCell>
                        <TableCell className="max-w-65 truncate font-mono text-xs text-muted-foreground">
                          {seat.holderPubkey}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {seatTypeLabel(seat.seatType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={seat.active ? "default" : "outline"}>
                            {seatStatusLabel(seat.active)}
                          </Badge>
                        </TableCell>
                        <TableCell>{seat.monthlyLimit.toLocaleString()}</TableCell>
                        <TableCell className="max-w-65 truncate font-mono text-xs text-muted-foreground">
                          {seat.seatPda}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                          {formatDate(seat.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <SeatRowActions
                            seat={seat}
                            onToggled={reloadSeats}
                            onEditClick={(seat) => {
                              setEditingSeat(seat);
                              setIsEditDialogOpen(true);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        No seats have been created yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </PaginatedTable>
      </div>

      <SeatDialog
        open={isCreateSeatOpen}
        onOpenChange={setIsCreateSeatOpen}
        onCreated={reloadSeats}
      />

      <EditSeatDialog
        seat={editingSeat}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdated={reloadSeats}
      />
    </div>
  );
}
