"use client";

import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useUsage } from "@/hooks/use-usage";
import { ActivityIcon, CoinsIcon, UsersIcon, ZapIcon } from "lucide-react";

export function SectionCards() {
  const { data, isLoading } = useUsage();

  const summary = data?.summary;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Vault USDC Balance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading
              ? "..."
              : (summary?.availableBalance ?? 0).toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <CoinsIcon className="mr-1 size-3" />
              USDC
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Available to consume
          </div>
          <div className="text-muted-foreground">
            Total deposited:{" "}
            {isLoading
              ? "..."
              : (summary?.totalDeposited ?? 0).toLocaleString()}{" "}
            USDC
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Seats</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "..." : (summary?.totalSeats ?? 0)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <UsersIcon className="mr-1 size-3" />
              Seats
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Agent and human access
          </div>
          <div className="text-muted-foreground">
            {isLoading ? "..." : (summary?.activeSeats ?? 0)} active currently
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>API Calls Today</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "..." : (summary?.apiCallsToday ?? 0).toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ActivityIcon className="mr-1 size-3" />
              Calls
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Real-time on-chain logs
          </div>
          <div className="text-muted-foreground">Enforced by Quota program</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Consumed</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading
              ? "..."
              : (summary?.consumedBalance ?? 0).toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ZapIcon className="mr-1 size-3" />
              Used
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            All-time usage
          </div>
          <div className="text-muted-foreground">
            {/* Billed through Dodo Payments */}
            Total Consumed = All time usage
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
