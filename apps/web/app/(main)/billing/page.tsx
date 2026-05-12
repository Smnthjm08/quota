"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import { PaginatedTable } from "../../../components/paginated-table";
import { Loader2Icon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@workspace/ui/components/table";
import { Button } from "@workspace/ui/components/button";

type Invoice = {
  paymentId: string;
  companyId?: string | null;
  amount?: number | null;
  currency?: string | null;
  invoiceUrl?: string | null;
  createdAt?: string | null;
};

const invoiceAmountFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatInvoiceAmount(
  amount: number | null | undefined,
  currency?: string | null
) {
  if (amount === null || amount === undefined) {
    return "-";
  }

  return `${invoiceAmountFormatter.format(amount / 100)} ${currency ?? "USD"}`;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingPaymentId, setDownloadingPaymentId] = useState<
    string | null
  >(null);

  async function fetchInvoices() {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/v1/billing/invoices");
      const body = res.data;
      setInvoices(body.data ?? []);
    } catch (err) {
      console.error(err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  async function downloadInvoice(invoice: Invoice) {
    setDownloadingPaymentId(invoice.paymentId);

    try {
      const response = await axiosInstance.get(
        `/api/v1/billing/invoice/${encodeURIComponent(invoice.paymentId)}/download`,
        { responseType: "blob" }
      );

      const contentType = String(
        response.headers["content-type"] ?? "application/pdf"
      );
      const blob = new Blob([response.data], {
        type: contentType,
      });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `invoice-${invoice.paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Invoice download failed", error);

      if (invoice.invoiceUrl) {
        window.open(invoice.invoiceUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setDownloadingPaymentId(null);
    }
  }

  useEffect(() => {
    void (async () => {
      await fetchInvoices();
    })();
  }, []);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
              <p className="text-muted-foreground">
                Manage your subscription and view payment history.
              </p>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={fetchInvoices}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-6">
          <PaginatedTable
            data={invoices}
            initialPageSize={10}
            emptyState={
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Loading invoices...
                  </span>
                ) : (
                  "No invoices or payments found."
                )}
              </div>
            }
          >
            {({ pageItems }) => (
              <Table>
                <TableHeader>
                  <tr className="text-left">
                    <TableHead className="px-4 py-2">Date</TableHead>
                    <TableHead className="px-4 py-2">Payment ID</TableHead>
                    <TableHead className="px-4 py-2">Amount</TableHead>
                    <TableHead className="px-4 py-2">Receipt</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {pageItems.map((inv) => (
                    <TableRow key={inv.paymentId}>
                      <TableCell className="px-4 py-3">
                        {inv.createdAt
                          ? new Date(inv.createdAt).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 break-all">
                        {inv.paymentId}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {formatInvoiceAmount(inv.amount, inv.currency)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Button
                          type="button"
                          className="inline-flex items-center gap-2 rounded bg-blue-600 px-3 py-1 text-white disabled:cursor-not-allowed disabled:opacity-70"
                          onClick={() => downloadInvoice(inv)}
                          disabled={downloadingPaymentId === inv.paymentId}
                        >
                          {downloadingPaymentId === inv.paymentId ? (
                            <>
                              <Loader2Icon className="h-4 w-4 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            "Download"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </PaginatedTable>
        </div>
      </div>
    </div>
  );
}
