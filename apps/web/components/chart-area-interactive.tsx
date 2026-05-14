"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import { type UsageEvent } from "@/hooks/use-usage";

export const description = "An interactive area chart";

const chartConfig = {
  usage: {
    label: "API Consumption",
  },
  calls: {
    label: "API Calls",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive({
  events = [],
  isLoading = false,
}: {
  events?: UsageEvent[];
  isLoading?: boolean;
}) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("30d");

  // Process events into chart data
  const chartData = React.useMemo(() => {
    if (!events.length) return [];

    const groupedData: Record<string, number> = {};

    // Filter for API_CONSUMED events and group by date
    events.forEach((event) => {
      if (event.type === "API_CONSUMED") {
        const date = new Date(event.createdAt).toISOString().split("T")[0];
        if (date) {
          groupedData[date] = (groupedData[date] || 0) + 1;
        }
      }
    });

    // Fill in gaps with 0 calls for a continuous line
    const dates = Object.keys(groupedData).sort();
    if (dates.length === 0 || !dates[0]) return [];

    const start = new Date(dates[0]);
    const end = new Date(); // Current date
    const result = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      if (dateStr) {
        result.push({
          date: dateStr,
          calls: groupedData[dateStr] || 0,
        });
      }
    }

    return result;
  }, [events]);

  React.useEffect(() => {
    if (isMobile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    if (!chartData.length) return [];

    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return chartData.filter((item) => {
      if (!item.date) return false;
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [chartData, timeRange]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>API Consumption</CardTitle>
        <CardDescription>
          Daily API calls for the selected period
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">90d</ToggleGroupItem>
            <ToggleGroupItem value="30d">30d</ToggleGroupItem>
            <ToggleGroupItem value="7d">7d</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex h-62.5 w-full items-center justify-center text-sm text-muted-foreground">
            Loading usage data...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex h-62.5 w-full items-center justify-center text-sm text-muted-foreground">
            No API activity recorded for this period.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-62.5 w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-calls)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-calls)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="calls"
                type="natural"
                fill="url(#fillCalls)"
                stroke="var(--color-calls)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
