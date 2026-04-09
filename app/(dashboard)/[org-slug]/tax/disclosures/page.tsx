"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import {
  getDisclosures,
  type Disclosure,
  type DisclosureType,
  type DisclosureStatus,
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
import { Loader2, ChevronLeft, ChevronRight, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  submitted: "bg-blue-100 text-blue-800",
  published: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const typeLabels: Record<string, string> = {
  annual_financial_statements: "Annual Financial Statements",
  change_notification: "Change Notification",
  insolvency: "Insolvency",
  merger: "Merger",
};

export default function DisclosuresPage() {
  const { currentOrg } = useOrg();
  const [disclosures, setDisclosures] = useState<Disclosure[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DisclosureStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<DisclosureType | "all">("all");
  const pageSize = 15;

  async function loadDisclosures() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const result = await getDisclosures(currentOrg.id, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        disclosure_type: typeFilter !== "all" ? typeFilter : undefined,
        page,
        pageSize,
      });
      setDisclosures(result.disclosures);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load disclosures");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDisclosures();
  }, [currentOrg, statusFilter, typeFilter, page]);

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

  const totalPages = Math.ceil(total / pageSize);

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
        <h2 className="text-2xl font-bold text-slate-900">Disclosures</h2>
        <p className="text-slate-600">Manage Bundesanzeiger disclosures</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v as DisclosureStatus | "all"); setPage(1); }}
        >
          <SelectTrigger className="w-44" id="status-filter">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => { setTypeFilter(v as DisclosureType | "all"); setPage(1); }}
        >
          <SelectTrigger className="w-48" id="type-filter">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="annual_financial_statements">Annual Financial Statements</SelectItem>
            <SelectItem value="change_notification">Change Notification</SelectItem>
            <SelectItem value="insolvency">Insolvency</SelectItem>
            <SelectItem value="merger">Merger</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disclosures ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : disclosures.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No disclosures found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disclosures.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Link
                          href={`/${currentOrg.slug}/tax/disclosures/${d.id}`}
                          className="font-mono text-sm font-medium hover:underline"
                        >
                          {d.disclosure_reference}
                        </Link>
                      </TableCell>
                      <TableCell>{typeLabels[d.disclosure_type]}</TableCell>
                      <TableCell className="max-w-xs truncate">{d.title}</TableCell>
                      <TableCell>{d.company?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[d.status] || ""}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {d.publication_date 
                              ? new Date(d.publication_date).toLocaleDateString() 
                              : "—"}
                          </span>
                        </div>
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
