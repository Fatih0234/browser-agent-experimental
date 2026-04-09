"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import { getMismatches, type ReconciliationMatch } from "@/lib/actions/reconciliation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function MismatchesPage() {
  const { currentOrg } = useOrg();
  const [matches, setMatches] = useState<ReconciliationMatch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 15;

  async function load() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const result = await getMismatches(currentOrg.id, { page, pageSize });
      setMatches(result.matches);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load mismatches");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [currentOrg, page]);

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/${currentOrg.slug}/reconciliation`} className="text-sm text-blue-600 hover:underline">
            ← Reconciliation
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          Flagged Mismatches
        </h2>
        <p className="text-slate-600">Invoices flagged for discrepancies requiring review</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flagged Items ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No flagged mismatches. All invoices are reconciled.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Invoice Amount</TableHead>
                    <TableHead>Expected Amount</TableHead>
                    <TableHead>Delta</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Flagged</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{m.invoice_source}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.invoice_amount.toLocaleString("de-DE", { style: "currency", currency: m.currency })}
                      </TableCell>
                      <TableCell>
                        {m.expected_amount
                          ? m.expected_amount.toLocaleString("de-DE", { style: "currency", currency: m.currency })
                          : <span className="text-slate-400">—</span>}
                      </TableCell>
                      <TableCell>
                        {m.amount_delta !== null ? (
                          <span className={`font-medium ${m.amount_delta === 0 ? "text-green-600" : "text-red-600"}`}>
                            {m.amount_delta > 0 ? "+" : ""}{m.amount_delta.toFixed(2)}
                          </span>
                        ) : <span className="text-slate-400">—</span>}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-red-700">
                        {m.flagged_reason ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {m.matched_at ? new Date(m.matched_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/${currentOrg.slug}/reconciliation/invoices/${m.invoice_id}?source=${m.invoice_source}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View
                        </Link>
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
