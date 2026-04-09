"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import { getReconciliationReport, generateReconciliationCsv } from "@/lib/actions/reconciliation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type PortalBreakdown = Record<string, {
  total: number;
  matched: number;
  flagged: number;
  pending: number;
  amount: number;
}>;

type Report = {
  carrierBreakdown: PortalBreakdown;
  marketplaceBreakdown: PortalBreakdown;
  totalFlaggedAmount: number;
};

export default function ReconciliationReportsPage() {
  const { currentOrg } = useOrg();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!currentOrg) return;
      setIsLoading(true);
      try {
        const data = await getReconciliationReport(currentOrg.id);
        setReport(data);
      } catch {
        toast.error("Failed to load report");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentOrg]);

  async function handleExportCsv() {
    if (!currentOrg) return;
    setIsExporting(true);
    try {
      const csv = await generateReconciliationCsv(currentOrg.id);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reconciliation-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  }

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  function BreakdownTable({ title, data }: { title: string; data: PortalBreakdown }) {
    const entries = Object.entries(data);
    if (entries.length === 0) return null;
    const totals = entries.reduce(
      (acc, [, v]) => ({
        total: acc.total + v.total,
        matched: acc.matched + v.matched,
        flagged: acc.flagged + v.flagged,
        pending: acc.pending + v.pending,
        amount: acc.amount + v.amount,
      }),
      { total: 0, matched: 0, flagged: 0, pending: 0, amount: 0 }
    );

    return (
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Portal</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Matched</TableHead>
                <TableHead className="text-right">Flagged</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Match Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(([portal, stats]) => (
                <TableRow key={portal}>
                  <TableCell className="font-medium">{portal}</TableCell>
                  <TableCell className="text-right">{stats.total}</TableCell>
                  <TableCell className="text-right text-green-600">{stats.matched}</TableCell>
                  <TableCell className="text-right text-red-600">{stats.flagged}</TableCell>
                  <TableCell className="text-right text-slate-500">{stats.pending}</TableCell>
                  <TableCell className="text-right font-medium">
                    {stats.amount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={stats.total > 0 && stats.matched / stats.total > 0.8 ? "text-green-600" : "text-slate-600"}>
                      {stats.total > 0 ? Math.round((stats.matched / stats.total) * 100) : 0}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="font-bold border-t-2">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{totals.total}</TableCell>
                <TableCell className="text-right text-green-600">{totals.matched}</TableCell>
                <TableCell className="text-right text-red-600">{totals.flagged}</TableCell>
                <TableCell className="text-right text-slate-500">{totals.pending}</TableCell>
                <TableCell className="text-right">
                  {totals.amount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                </TableCell>
                <TableCell className="text-right">
                  {totals.total > 0 ? Math.round((totals.matched / totals.total) * 100) : 0}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/${currentOrg.slug}/reconciliation`} className="text-sm text-blue-600 hover:underline">
              ← Reconciliation
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Reconciliation Report</h2>
          <p className="text-slate-600">Cross-portal invoice reconciliation summary</p>
        </div>
        <Button onClick={handleExportCsv} disabled={isExporting} id="export-csv-btn">
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
          Export CSV
        </Button>
      </div>

      {report?.totalFlaggedAmount !== undefined && report.totalFlaggedAmount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700 font-medium">
              Total discrepancy amount:{" "}
              <span className="text-lg font-bold">
                {report.totalFlaggedAmount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {report && <BreakdownTable title="Carrier Invoice Reconciliation" data={report.carrierBreakdown} />}
      {report && <BreakdownTable title="Marketplace Order Reconciliation" data={report.marketplaceBreakdown} />}

      {report && Object.keys(report.carrierBreakdown).length === 0 && Object.keys(report.marketplaceBreakdown).length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-slate-500 py-8">
            No data available. Seed data first to populate this report.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
