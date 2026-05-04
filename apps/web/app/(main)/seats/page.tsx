"use client";

import { useState } from "react";
import { PlusCircleIcon, RefreshCcwIcon } from "lucide-react";
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
import { SeatDialog } from "@/components/seats/seat-dialog";
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

export default function SeatsPage() {
  const { seats, isLoading, errorMessage, reloadSeats } = useSeats();
  const [isCreateSeatOpen, setIsCreateSeatOpen] = useState(false);

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

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Holder wallet</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Monthly limit</TableHead>
                <TableHead>Seat PDA</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    Loading seats...
                  </TableCell>
                </TableRow>
              ) : seats.length > 0 ? (
                seats.map((seat, index) => (
                  <TableRow key={seat.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{seat.name}</TableCell>
                    <TableCell className="max-w-65 truncate font-mono text-xs text-muted-foreground">
                      {seat.holderPubkey}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {seatTypeLabel(seat.seatType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{seat.monthlyLimit.toLocaleString()}</TableCell>
                    <TableCell className="max-w-65 truncate font-mono text-xs text-muted-foreground">
                      {seat.seatPda}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                      {formatDate(seat.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No seats have been created yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <SeatDialog
        open={isCreateSeatOpen}
        onOpenChange={setIsCreateSeatOpen}
        onCreated={reloadSeats}
      />
    </div>
  );
}
