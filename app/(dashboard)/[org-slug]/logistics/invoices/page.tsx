"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/client";
import { getInvoiceSignedUrl, type ShipmentInvoice } from "@/lib/actions/shipments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface InvoiceWithTracking extends ShipmentInvoice {
  shipments: { tracking_number: string } | null;
}

export default function InvoicesPage() {
  const { currentOrg } = useOrg();
  const [invoices, setInvoices] = useState<InvoiceWithTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentOrg) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shipment_invoices")
        .select("*, shipments(tracking_number)")
        .eq("org_id", currentOrg.id)
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Failed to load invoices");
      } else {
        setInvoices((data as InvoiceWithTracking[]) ?? []);
      }
      setIsLoading(false);
    }
    load();
  }, [currentOrg]);

  async function handleDownload(invoiceId: string) {
    try {
      const url = await getInvoiceSignedUrl(invoiceId);
      window.open(url, "_blank");
    } catch {
      toast.error("Failed to get download link");
    }
  }

  if (!currentOrg) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/logistics`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Logistics
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Invoices</h2>
          <p className="text-slate-600">All carrier invoices for {currentOrg.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No invoices found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                    <TableCell>
                      {inv.shipments ? (
                        <Link
                          href={`/${currentOrg.slug}/logistics/${inv.shipment_id}`}
                          className="font-mono text-sm hover:underline"
                        >
                          {inv.shipments.tracking_number}
                        </Link>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{inv.amount.toFixed(2)} {inv.currency}</TableCell>
                    <TableCell>{new Date(inv.issued_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {inv.storage_path && (
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(inv.id)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
