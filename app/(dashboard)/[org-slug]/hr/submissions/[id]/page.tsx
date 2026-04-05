"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import {
  getSubmission,
  submitSubmission,
  updateSubmissionStatus,
  type SubmissionStatus,
} from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Send } from "lucide-react";
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

export default function SubmissionDetailPage() {
  const { currentOrg, isAdmin } = useOrg();
  const params = useParams();
  const id = params.id as string;

  const [submission, setSubmission] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [adminStatus, setAdminStatus] = useState<SubmissionStatus>("in_review");

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await getSubmission(id);
        setSubmission(data);
        setAdminStatus(data.status === "draft" ? "in_review" : data.status);
      } catch {
        toast.error("Failed to load submission");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit() {
    setIsActing(true);
    try {
      const updated = await submitSubmission(id);
      setSubmission((prev: any) => ({ ...prev, ...updated }));
      toast.success("Submission sent successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setIsActing(false);
    }
  }

  async function handleAdminStatusUpdate() {
    setIsActing(true);
    try {
      const updated = await updateSubmissionStatus(id, adminStatus);
      setSubmission((prev: any) => ({ ...prev, ...updated }));
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsActing(false);
    }
  }

  if (!currentOrg) return null;
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  if (!submission) return <div className="text-slate-600">Submission not found.</div>;

  const emp = submission.employees;
  const meta = submission.metadata as Record<string, string>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/hr/submissions`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {submissionTypeLabels[submission.submission_type] || submission.submission_type}
          </h2>
          <p className="text-slate-600">
            {emp ? `${emp.first_name} ${emp.last_name} · ${emp.department}` : ""}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className={statusColors[submission.status] || ""}>{submission.status.replace("_", " ")}</Badge>
            {submission.reference_number && (
              <span className="text-sm font-mono text-slate-600">Ref: {submission.reference_number}</span>
            )}
          </div>

          {/* Submit action for draft */}
          {submission.status === "draft" && (
            <Button onClick={handleSubmit} disabled={isActing} size="sm">
              {isActing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Submit to Portal
            </Button>
          )}

          {/* Admin status update */}
          {isAdmin && submission.status !== "draft" && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm text-slate-500">Admin: update status</span>
              <Select value={adminStatus} onValueChange={(v) => setAdminStatus(v as SubmissionStatus)}>
                <SelectTrigger className="w-40" id="admin-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAdminStatusUpdate}
                disabled={isActing || adminStatus === submission.status}
              >
                {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Submission Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="text-sm space-y-3">
            <div>
              <dt className="text-slate-500">Employee</dt>
              {emp && (
                <dd className="font-medium">
                  <Link href={`/${currentOrg.slug}/hr/employees/${submission.employee_id}`} className="hover:underline">
                    {emp.first_name} {emp.last_name}
                  </Link>
                  {" "}({emp.employee_number})
                </dd>
              )}
            </div>
            <div>
              <dt className="text-slate-500">Type</dt>
              <dd className="font-medium">{submissionTypeLabels[submission.submission_type] || submission.submission_type}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Submitted At</dt>
              <dd>{submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "Not yet submitted"}</dd>
            </div>
            {Object.entries(meta).filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <dt className="text-slate-500 capitalize">{k.replace(/_/g, " ")}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
            {submission.notes && (
              <div>
                <dt className="text-slate-500">Notes</dt>
                <dd>{submission.notes}</dd>
              </div>
            )}
            <div>
              <dt className="text-slate-500">Created</dt>
              <dd>{new Date(submission.created_at).toLocaleString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
