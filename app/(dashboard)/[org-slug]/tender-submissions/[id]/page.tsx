"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import {
  getSubmission,
  updateSubmission,
  submitBid,
  type TenderSubmission,
  type SubmissionStatus,
} from "@/lib/actions/tenders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Building2, FileText, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function TenderSubmissionDetailPage() {
  const params = useParams();
  const { currentOrg } = useOrg();
  const [submission, setSubmission] = useState<TenderSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const submissionId = params.id as string;

  async function loadSubmission() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const data = await getSubmission(submissionId);
      setSubmission(data);
    } catch {
      toast.error("Failed to load submission");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSubmission();
  }, [currentOrg, submissionId]);

  async function handleStatusChange(newStatus: SubmissionStatus) {
    if (!submission) return;
    setIsUpdating(true);
    try {
      await updateSubmission(submission.id, { status: newStatus });
      toast.success(`Submission status updated to ${newStatus}`);
      loadSubmission();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSubmit() {
    if (!submission) return;
    setIsUpdating(true);
    try {
      await submitBid(submission.id);
      toast.success("Bid submitted successfully");
      loadSubmission();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit bid");
    } finally {
      setIsUpdating(false);
    }
  }

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Submission not found</p>
        <Link href={`/${currentOrg.slug}/tender-submissions`} className="text-blue-600 hover:underline mt-2 inline-block">
          Back to submissions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${currentOrg.slug}/tender-submissions`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Submission {submission.submission_reference || "—"}
            </h2>
            <p className="text-slate-600">
              For: {submission.tender?.title || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusColors[submission.status] || ""}>
            {submission.status.replace("_", " ")}
          </Badge>
          {submission.status === "draft" && (
            <Button onClick={handleSubmit} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit Bid
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submission Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Bid Amount</p>
                  <p className="font-medium text-lg">
                    {submission.bid_amount 
                      ? `€${submission.bid_amount.toLocaleString()}` 
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Currency</p>
                  <p className="font-medium">{submission.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Submitted At</p>
                  <p className="font-medium">
                    {submission.submitted_at 
                      ? new Date(submission.submitted_at).toLocaleString() 
                      : "Not submitted"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="font-medium">{new Date(submission.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {submission.technical_proposal && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Technical Proposal</p>
                  <div className="bg-slate-50 p-4 rounded-md">
                    <p className="text-slate-700 whitespace-pre-wrap">{submission.technical_proposal}</p>
                  </div>
                </div>
              )}

              {submission.financial_proposal && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Financial Proposal</p>
                  <div className="bg-slate-50 p-4 rounded-md">
                    <p className="text-slate-700 whitespace-pre-wrap">{submission.financial_proposal}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tender Info */}
          {submission.tender && (
            <Card>
              <CardHeader>
                <CardTitle>Related Tender</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{submission.tender.title}</p>
                  <p className="text-sm text-slate-500 font-mono">{submission.tender.tender_id}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-slate-600">
                    Type: <span className="capitalize">{submission.tender.tender_type}</span>
                  </span>
                  <span className="text-slate-600">
                    Value: {submission.tender.estimated_value 
                      ? `€${submission.tender.estimated_value.toLocaleString()}` 
                      : "—"}
                  </span>
                </div>
                <Link 
                  href={`/${currentOrg.slug}/tenders/${submission.tender.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View tender →
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supplier Info */}
          {submission.supplier_company && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Supplier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{submission.supplier_company.name}</p>
                  <p className="text-sm text-slate-500">{submission.supplier_company.legal_form}</p>
                </div>
                <div className="text-sm text-slate-600">
                  <p>{submission.supplier_company.street}</p>
                  <p>{submission.supplier_company.postcode} {submission.supplier_company.city}</p>
                </div>
                {submission.supplier_company.vat_id && (
                  <p className="text-sm text-slate-500">VAT: {submission.supplier_company.vat_id}</p>
                )}
                <Link 
                  href={`/${currentOrg.slug}/companies/${submission.supplier_company.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View company →
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={submission.status}
                  onValueChange={(v) => handleStatusChange(v as SubmissionStatus)}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
