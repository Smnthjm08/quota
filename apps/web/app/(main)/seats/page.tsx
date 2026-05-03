import { DataTable } from "@/components/data-table";

import data from "@/app/(main)/dashboard/data.json";

export default function SeatsPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {" "}
        <DataTable data={data} />
      </div>
    </div>
  );
}
