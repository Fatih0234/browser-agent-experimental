"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import { getReconciliationSummary, getUnifiedInvoices, type ReconciliationSummary, type UnifiedInvoice } from "@/lib/actions/reconciliation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertTriangle, Clock, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-800",
  matched: "bg-green-100 text-green-800",
  flagged: "bg-red-100 text-red-800",
  dismissed: "bg-slate-100 text-slate-500",
};

export default function ReconciliationPage() {
  const { currentOrg } = useOrg();
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [recent, setRecent] = useState<UnifiedInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentOrg) return;
      setIsLoading(true);
      try {
        const [s, { invoices }] = await Promise.all([
          getReconciliationSummary(currentOrg.id),
          getUnifiedInvoices(currentOrg.id, { pageSize: 8 }),
        ]);
        setSummary(s);
        setRecent(invoices);
      } catch {
        toast.error("Failed to load reconciliation data");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentOrg]);

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Reconciliation</h2>
        <p className="text-slate-600">Cross-portal invoice and report reconciliation</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-slate-400" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{summary?.pending ?? 0}</p>
                <p className="text-sm text-slate-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{summary?.matched ?? 0}</p>
                <p className="text-sm text-slate-500">Matched</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{summary?.flagged ?? 0}</p>
                <p className="text-sm text-slate-500">Flagged</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-slate-400" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{summary?.total ?? 0}</p>
                <p className="text-sm text-slate-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Amount summary */}
      {summary && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Total Invoice Volume</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                {summary.total_invoice_amount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </p>
              <p className="text-sm text-slate-500 mt-1">across {summary.total} invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Discrepancy</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {summary.total_discrepancy.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </p>
              <p className="text-sm text-slate-500 mt-1">{summary.flagged} flagged items</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Invoices</CardTitle>
          <Link href={`/${currentOrg.slug}/reconciliation/invoices`} className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No invoices found. Seed data to populate.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((inv) => (
                  <TableRow key={`${inv.invoice_source}-${inv.id}`}>
                    <TableCell>
                      <Link
                        href={`/${currentOrg.slug}/reconciliation/invoices/${inv.id}?source=${inv.invoice_source}`}
                        className="font-mono text-sm font-medium hover:underline"
                      >
                        {inv.reference}
                      </Link>
                    </TableCell>
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
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(inv.issued_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Navigation links */}
      <div className="flex gap-6 text-sm">
        <Link href={`/${currentOrg.slug}/reconciliation/invoices`} className="text-blue-600 hover:underline">
          All invoices →
        </Link>
        <Link href={`/${currentOrg.slug}/reconciliation/mismatches`} className="text-red-600 hover:underline">
          Flagged mismatches →
        </Link>
        <Link href={`/${currentOrg.slug}/reconciliation/reports`} className="text-blue-600 hover:underline">
          Reports →
        </Link>
      </div>
    </div>
  );
}
