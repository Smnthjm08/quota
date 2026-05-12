"use client";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

// import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/cards/section-cards";
import { useUsage } from "@/hooks/use-usage";

export default function Page() {
  const { data: usageData, isLoading } = useUsage();

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            A high-level view of your vault and API consumption.
          </p>
        </div>

        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive
            events={usageData?.events || []}
            isLoading={isLoading}
          />
        </div>
        {/* <DataTable data={data} /> */}
      </div>
    </div>
  );
}
