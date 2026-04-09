"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import {
  getTenders,
  type Tender,
  type TenderStatus,
  type TenderType,
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
import { Plus, Loader2, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  published: "bg-blue-100 text-blue-800",
  open: "bg-green-100 text-green-800",
  closing_soon: "bg-yellow-100 text-yellow-800",
  closed: "bg-slate-100 text-slate-800",
  awarded: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

const typeColors: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  restricted: "bg-yellow-100 text-yellow-800",
  negotiated: "bg-purple-100 text-purple-800",
};

export default function TendersPage() {
  const { currentOrg } = useOrg();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TenderStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<TenderType | "all">("all");
  const pageSize = 15;

  async function loadTenders() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const result = await getTenders(currentOrg.id, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        tender_type: typeFilter !== "all" ? typeFilter : undefined,
        page,
        pageSize,
      });
      setTenders(result.tenders);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load tenders");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTenders();
  }, [currentOrg, statusFilter, typeFilter, page]);

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

  const totalPages = Math.ceil(total / pageSize);

  function getDaysUntilDeadline(deadlineDate: string): number {
    const deadline = new Date(deadlineDate);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tender Desk</h2>
          <p className="text-slate-600">Public procurement portal simulation</p>
        </div>
        <Link href={`/${currentOrg.slug}/tenders/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Tender
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v as TenderStatus | "all"); setPage(1); }}
        >
          <SelectTrigger className="w-44" id="status-filter">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closing_soon">Closing Soon</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="awarded">Awarded</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => { setTypeFilter(v as TenderType | "all"); setPage(1); }}
        >
          <SelectTrigger className="w-40" id="type-filter">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="restricted">Restricted</SelectItem>
            <SelectItem value="negotiated">Negotiated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenders ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : tenders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No tenders found. Create your first tender to get started.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tender ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenders.map((t) => {
                    const daysLeft = getDaysUntilDeadline(t.deadline_date);
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Link
                            href={`/${currentOrg.slug}/tenders/${t.id}`}
                            className="font-mono text-sm font-medium hover:underline"
                          >
                            {t.tender_id}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{t.title}</TableCell>
                        <TableCell>{t.buyer_company?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge className={typeColors[t.tender_type] || ""}>
                            {t.tender_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[t.status] || ""}>
                            {t.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className={daysLeft < 7 && daysLeft > 0 ? "text-red-600 font-medium" : ""}>
                              {new Date(t.deadline_date).toLocaleDateString()}
                              {daysLeft > 0 && daysLeft < 30 && (
                                <span className="text-xs ml-1">({daysLeft}d)</span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {t.estimated_value 
                            ? `€${t.estimated_value.toLocaleString()}` 
                            : "—"}
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

      <div className="flex gap-4">
        <Link href={`/${currentOrg.slug}/tender-submissions`} className="text-sm text-blue-600 hover:underline">
          View all submissions →
        </Link>
        <Link href={`/${currentOrg.slug}/companies`} className="text-sm text-blue-600 hover:underline">
          Company directory →
        </Link>
      </div>
    </div>
  );
}
