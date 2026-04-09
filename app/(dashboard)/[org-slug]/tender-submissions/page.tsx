"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import {
  getSubmissions,
  type TenderSubmission,
  type SubmissionStatus,
} from "@/lib/actions/tenders";
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
import { Loader2, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function TenderSubmissionsPage() {
  const { currentOrg } = useOrg();
  const [submissions, setSubmissions] = useState<TenderSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">("all");
  const pageSize = 15;

  async function loadSubmissions() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const result = await getSubmissions(currentOrg.id, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        pageSize,
      });
      setSubmissions(result.submissions);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, [currentOrg, statusFilter, page]);

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${currentOrg.slug}/tenders`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenders
          </Button>
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tender Submissions</h2>
        <p className="text-slate-600">Manage bids and proposals</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v as SubmissionStatus | "all"); setPage(1); }}
        >
          <SelectTrigger className="w-44" id="status-filter">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No submissions found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Tender</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Bid Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link
                          href={`/${currentOrg.slug}/tender-submissions/${s.id}`}
                          className="font-mono text-sm font-medium hover:underline"
                        >
                          {s.submission_reference || "—"}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {s.tender?.title || "—"}
                      </TableCell>
                      <TableCell>{s.supplier_company?.name || "—"}</TableCell>
                      <TableCell>
                        {s.bid_amount ? `€${s.bid_amount.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[s.status] || ""}>
                          {s.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {s.submitted_at 
                          ? new Date(s.submitted_at).toLocaleDateString() 
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
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
