"use client";

import { useUsage, type UsageEvent } from "@/hooks/use-usage";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAmount(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${value.toFixed(2)} USDC`;
}

function eventBadgeVariant(
  type: UsageEvent["type"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "VAULT_FUNDED":
      return "default";
    case "VAULT_CREATED":
      return "secondary";
    case "SEAT_CREATED":
      return "outline";
    case "API_CONSUMED":
      return "destructive";
    case "SEAT_TOGGLED":
    case "SEAT_UPDATED":
      return "secondary";
    default:
      return "outline";
  }
}

export default function UsagePage() {
  const { data, paginatedEvents, isLoading, errorMessage, pagination } =
    useUsage();
  const { currentPage, totalPages, setCurrentPage } = pagination;

  const summary = data?.summary;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-3xl font-bold tracking-tight">Usage</h1>
          <p className="text-muted-foreground">
            Vault funding, seat allocation, and activity logs in one place.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>
              Deposited:{" "}
              {isLoading
                ? "Loading..."
                : formatAmount(summary?.totalDeposited ?? null)}
            </span>
            <span>
              Used:{" "}
              {isLoading
                ? "Loading..."
                : formatAmount(summary?.usedBalance ?? null)}
            </span>
            <span>
              Available:{" "}
              {isLoading
                ? "Loading..."
                : formatAmount(summary?.availableBalance ?? null)}
            </span>
            <span>
              Active seats:{" "}
              {isLoading ? "Loading..." : (summary?.activeSeats ?? "—")}
            </span>
          </div>
        </div>

        {errorMessage ? (
          <div className="mx-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive lg:px-6">
            {errorMessage}
          </div>
        ) : null}

        <div className="px-4 lg:px-6">
          <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium">Usage log</p>
              <p className="text-xs text-muted-foreground">
                Ordered newest first. Vault events, seat changes, and deposits
                appear here.
              </p>
            </div>

            <div className="max-h-128 overflow-auto">
              {isLoading ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Loading usage logs...
                </div>
              ) : paginatedEvents.length ? (
                <div className="divide-y">
                  {paginatedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-start md:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={eventBadgeVariant(event.type)}>
                            {event.type}
                          </Badge>
                          <p className="font-medium">{event.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(event.createdAt)}
                          {event.seat ? ` • Seat ${event.seat.name}` : ""}
                        </p>
                        {event.txSignature ? (
                          <a
                            href={`https://explorer.solana.com/tx/${event.txSignature}?cluster=devnet`}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate font-mono text-xs text-muted-foreground transition-colors hover:text-primary hover:underline"
                          >
                            {event.txSignature}
                          </a>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded-full border px-2 py-1 text-muted-foreground">
                          {formatAmount(event.amountUsdc)}
                        </span>
                        <span className="rounded-full border px-2 py-1 text-muted-foreground">
                          ID {event.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No usage logs yet.
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* <div className="px-4 lg:px-6">
          <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium">Current seats</p>
              <p className="text-xs text-muted-foreground">
                A compact state view for limits and current usage.
              </p>
            </div>

            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead>Consumed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        Loading seats...
                      </TableCell>
                    </TableRow>
                  ) : data?.seats.length ? (
                    data.seats.map((seat) => (
                      <TableRow key={seat.id}>
                        <TableCell className="font-medium">
                          {seat.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{seat.seatType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={seat.active ? "default" : "secondary"}
                          >
                            {seat.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {seat.monthlyLimit.toLocaleString()} USDC
                        </TableCell>
                        <TableCell>
                          {seat.consumed.toLocaleString()} USDC
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        No seats yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
