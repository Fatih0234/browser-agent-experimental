"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import {
  getTaxFilings,
  type TaxFiling,
  type FilingType,
  type FilingStatus,
} from "@/lib/actions/tax";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, ArrowLeft, Calendar, Euro } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  submitted: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  correction_needed: "bg-yellow-100 text-yellow-800",
};

export default function TaxFilingsPage() {
  const { currentOrg } = useOrg();
  const [filings, setFilings] = useState<TaxFiling[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilingStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<FilingType | "all">("all");
  const pageSize = 15;

  async function loadFilings() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const result = await getTaxFilings(currentOrg.id, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        filing_type: typeFilter !== "all" ? typeFilter : undefined,
        page,
        pageSize,
      });
      setFilings(result.filings);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load tax filings");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFilings();
  }, [currentOrg, statusFilter, typeFilter, page]);

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

  const totalPages = Math.ceil(total / pageSize);

  function getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${currentOrg.slug}/tax`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tax Dashboard
          </Button>
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tax Filings</h2>
        <p className="text-slate-600">Manage ELSTER tax filings</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v as FilingStatus | "all"); setPage(1); }}
        >
          <SelectTrigger className="w-44" id="status-filter">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="correction_needed">Correction Needed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => { setTypeFilter(v as FilingType | "all"); setPage(1); }}
        >
          <SelectTrigger className="w-48" id="type-filter">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="USt-Voranmeldung">USt-Voranmeldung</SelectItem>
            <SelectItem value="USt-Erklärung">USt-Erklärung</SelectItem>
            <SelectItem value="Gewerbesteuer">Gewerbesteuer</SelectItem>
            <SelectItem value="Körperschaftsteuer">Körperschaftsteuer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tax Filings ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No tax filings found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Tax Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filings.map((f) => {
                    const daysLeft = getDaysUntilDue(f.due_date);
                    return (
                      <TableRow key={f.id}>
                        <TableCell>
                          <Link
                            href={`/${currentOrg.slug}/tax/filings/${f.id}`}
                            className="font-mono text-sm font-medium hover:underline"
                          >
                            {f.filing_reference}
                          </Link>
                        </TableCell>
                        <TableCell>{f.filing_type}</TableCell>
                        <TableCell>{f.filing_period}</TableCell>
                        <TableCell>{f.company?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[f.status] || ""}>
                            {f.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className={daysLeft < 7 && daysLeft > 0 && f.status === "draft" ? "text-red-600 font-medium" : ""}>
                              {new Date(f.due_date).toLocaleDateString()}
                              {daysLeft > 0 && daysLeft < 30 && f.status === "draft" && (
                                <span className="text-xs ml-1">({daysLeft}d)</span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {f.tax_payable ? (
                            <span className={f.tax_payable > 0 ? "text-red-600" : "text-green-600"}>
                              <Euro className="h-3 w-3 inline mr-1" />
                              {f.tax_payable.toLocaleString()}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
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
