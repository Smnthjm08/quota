"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

type UsageSeat = {
  id: string;
  name: string;
  active: boolean;
  monthlyLimit: number;
  consumed: number;
  seatType: "HUMAN" | "AGENT";
};

type UsageEvent = {
  id: string;
  type:
    | "VAULT_CREATED"
    | "VAULT_FUNDED"
    | "SEAT_CREATED"
    | "SEAT_UPDATED"
    | "SEAT_TOGGLED"
    | "API_CONSUMED";
  title: string;
  amountUsdc: number | null;
  txSignature: string | null;
  createdAt: string;
  seat?: {
    id: string;
    name: string;
  } | null;
};

type UsageResponse = {
  message: string;
  data: {
    summary: {
      totalDeposited: number;
      usedBalance: number;
      availableBalance: number;
      activeSeats: number;
      totalSeats: number;
      consumedBalance: number;
      apiCallsToday: number;
    };
    seats: UsageSeat[];
    events: UsageEvent[];
  };
};

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

function eventBadgeVariant(type: UsageEvent["type"]) {
  if (type === "VAULT_CREATED" || type === "VAULT_FUNDED") {
    return "default" as const;
  }

  if (type === "SEAT_CREATED") {
    return "secondary" as const;
  }

  if (type === "API_CONSUMED") {
    return "destructive" as const;
  }

  return "outline" as const;
}

export default function UsagePage() {
  const [data, setData] = useState<UsageResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response =
          await axiosInstance.get<UsageResponse>("/api/v1/usage");
        if (!cancelled) {
          setData(response.data.data);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "We could not load usage right now."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadUsage();

    return () => {
      cancelled = true;
    };
  }, []);

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
              ) : data?.events.length ? (
                <div className="divide-y">
                  {data.events.map((event) => (
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
          </div>
        </div>

        <div className="px-4 lg:px-6">
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
        </div>
      </div>
    </div>
  );
}
