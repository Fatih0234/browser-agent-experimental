"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import {
  getUnifiedInvoices,
  type UnifiedInvoice,
  type ReconciliationStatus,
  type InvoiceSource,
} from "@/lib/actions/reconciliation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-800",
  matched: "bg-green-100 text-green-800",
  flagged: "bg-red-100 text-red-800",
  dismissed: "bg-slate-100 text-slate-500",
};

export default function ReconciliationInvoicesPage() {
  const { currentOrg } = useOrg();
  const [invoices, setInvoices] = useState<UnifiedInvoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReconciliationStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<InvoiceSource | "all">("all");
  const pageSize = 20;

  async function loadInvoices() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const result = await getUnifiedInvoices(currentOrg.id, {
        status: statusFilter,
        source: sourceFilter,
        page,
        pageSize,
      });
      setInvoices(result.invoices);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, [currentOrg, statusFilter, sourceFilter, page]);

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/${currentOrg.slug}/reconciliation`} className="text-sm text-blue-600 hover:underline">
              ← Reconciliation
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">All Invoices</h2>
          <p className="text-slate-600">Invoices from all connected portals</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v as ReconciliationStatus | "all"); setPage(1); }}
        >
          <SelectTrigger className="w-44" id="status-filter">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="matched">Matched</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sourceFilter}
          onValueChange={(v) => { setSourceFilter(v as InvoiceSource | "all"); setPage(1); }}
        >
          <SelectTrigger className="w-44" id="source-filter">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="shipment">Carrier (Logistics)</SelectItem>
            <SelectItem value="marketplace">Marketplace</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No invoices found. Try adjusting filters or seed data first.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Portal</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delta</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={`${inv.invoice_source}-${inv.id}`}>
                      <TableCell>
                        <Link
                          href={`/${currentOrg.slug}/reconciliation/invoices/${inv.id}?source=${inv.invoice_source}`}
                          className="font-mono text-sm font-medium hover:underline"
                        >
                          {inv.reference}
                        </Link>
                      </TableCell>
                      <TableCell className="capitalize text-sm text-slate-600">{inv.invoice_source}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{inv.portal_label}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {inv.amount.toLocaleString("de-DE", { style: "currency", currency: inv.currency })}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[inv.reconciliation_status] || ""}>
                          {inv.reconciliation_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {inv.amount_delta !== null ? (
                          <span className={inv.amount_delta === 0 ? "text-green-600" : "text-red-600 font-medium"}>
                            {inv.amount_delta > 0 ? "+" : ""}{inv.amount_delta.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(inv.issued_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-500">
                    Page {page} of {totalPages} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
