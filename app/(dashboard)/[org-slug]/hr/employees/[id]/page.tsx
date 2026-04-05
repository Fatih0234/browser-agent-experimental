"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import { getEmployee, getSubmissions, type Employee, type HrSubmission } from "@/lib/actions/hr";
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
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  on_leave: "bg-yellow-100 text-yellow-800",
  terminated: "bg-red-100 text-red-800",
};

const submissionStatusColors: Record<string, string> = {
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

export default function EmployeeDetailPage() {
  const { currentOrg } = useOrg();
  const params = useParams();
  const id = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [submissions, setSubmissions] = useState<HrSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id || !currentOrg) return;
      try {
        const [emp, subs] = await Promise.all([
          getEmployee(id),
          getSubmissions(currentOrg.id, { employee_id: id }),
        ]);
        setEmployee(emp);
        setSubmissions(subs as HrSubmission[]);
      } catch {
        toast.error("Failed to load employee data");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentOrg]);

  if (!currentOrg) return null;
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  if (!employee) return <div className="text-slate-600">Employee not found.</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/hr`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{employee.first_name} {employee.last_name}</h2>
          <p className="text-slate-600">{employee.position} · {employee.department}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Employee Info</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt className="text-slate-500">Employee #</dt><dd className="font-mono font-medium">{employee.employee_number}</dd></div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd><Badge className={statusColors[employee.status] || ""}>{employee.status.replace("_", " ")}</Badge></dd>
            </div>
            <div><dt className="text-slate-500">Department</dt><dd>{employee.department}</dd></div>
            <div><dt className="text-slate-500">Position</dt><dd>{employee.position}</dd></div>
            <div><dt className="text-slate-500">Hire Date</dt><dd>{new Date(employee.hire_date).toLocaleDateString()}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Submissions ({submissions.length})</CardTitle>
          <Link href={`/${currentOrg.slug}/hr/submissions/new?employee_id=${employee.id}`}>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              New Submission
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-slate-500 text-sm">No submissions for this employee.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference #</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link href={`/${currentOrg.slug}/hr/submissions/${s.id}`} className="hover:underline">
                        {submissionTypeLabels[s.submission_type] || s.submission_type}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={submissionStatusColors[s.status] || ""}>{s.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{s.reference_number ?? "—"}</TableCell>
                    <TableCell>{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : "—"}</TableCell>
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
