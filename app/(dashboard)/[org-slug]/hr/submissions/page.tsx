"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import { getSubmissions, type SubmissionType, type SubmissionStatus } from "@/lib/actions/hr";
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
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  submitted: "bg-blue-100 text-blue-800",
  in_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const submissionTypeLabels: Record<string, string> = {
  sick_note: "Sick Note (eAU)",
  kurzarbeit: "Kurzarbeit",
  hiring_support: "Hiring Support",
};

type SubmissionWithEmployee = Awaited<ReturnType<typeof getSubmissions>>[0];

export default function SubmissionsPage() {
  const { currentOrg } = useOrg();
  const [submissions, setSubmissions] = useState<SubmissionWithEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<SubmissionType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">("all");

  async function loadSubmissions() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const data = await getSubmissions(currentOrg.id, {
        submission_type: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setSubmissions(data);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadSubmissions(); }, [currentOrg, typeFilter, statusFilter]);

  if (!currentOrg) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${currentOrg.slug}/hr`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Submissions</h2>
            <p className="text-slate-600">Employer service portal submissions</p>
          </div>
        </div>
        <Link href={`/${currentOrg.slug}/hr/submissions/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Submission
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as SubmissionType | "all")}>
          <SelectTrigger className="w-48" id="submission-type-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="sick_note">Sick Note (eAU)</SelectItem>
            <SelectItem value="kurzarbeit">Kurzarbeit</SelectItem>
            <SelectItem value="hiring_support">Hiring Support</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SubmissionStatus | "all")}>
          <SelectTrigger className="w-40" id="submission-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle>All Submissions ({submissions.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No submissions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference #</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link href={`/${currentOrg.slug}/hr/submissions/${s.id}`} className="hover:underline font-medium">
                        {submissionTypeLabels[s.submission_type] || s.submission_type}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/${currentOrg.slug}/hr/employees/${s.employee_id}`} className="hover:underline">
                        {s.employees.last_name}, {s.employees.first_name}
                      </Link>
                    </TableCell>
                    <TableCell>{s.employees.department}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[s.status] || ""}>{s.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{s.reference_number ?? "—"}</TableCell>
                    <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
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
