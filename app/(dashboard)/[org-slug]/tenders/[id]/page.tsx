"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import {
  getTender,
  getSubmissions,
  updateTender,
  type Tender,
  type TenderSubmission,
  type TenderStatus,
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
import { Loader2, ArrowLeft, FileText, Building2, Mail, Phone, User } from "lucide-react";
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

const submissionStatusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function TenderDetailPage() {
  const params = useParams();
  const { currentOrg } = useOrg();
  const [tender, setTender] = useState<Tender | null>(null);
  const [submissions, setSubmissions] = useState<TenderSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const tenderId = params.id as string;

  async function loadData() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const [tenderData, submissionsData] = await Promise.all([
        getTender(tenderId),
        getSubmissions(currentOrg.id, { tender_id: tenderId }),
      ]);
      setTender(tenderData);
      setSubmissions(submissionsData.submissions);
    } catch {
      toast.error("Failed to load tender details");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentOrg, tenderId]);

  async function handleStatusChange(newStatus: TenderStatus) {
    if (!tender) return;
    setIsUpdating(true);
    try {
      await updateTender(tender.id, { status: newStatus });
      toast.success(`Tender status updated to ${newStatus}`);
      loadData();
    } catch {
      toast.error("Failed to update status");
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

  if (!tender) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Tender not found</p>
        <Link href={`/${currentOrg.slug}/tenders`} className="text-blue-600 hover:underline mt-2 inline-block">
          Back to tenders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${currentOrg.slug}/tenders`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{tender.title}</h2>
            <p className="text-slate-600 font-mono">{tender.tender_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusColors[tender.status] || ""}>
            {tender.status.replace("_", " ")}
          </Badge>
          <Select
            value={tender.status}
            onValueChange={(v) => handleStatusChange(v as TenderStatus)}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closing_soon">Closing Soon</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="awarded">Awarded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tender Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <p className="font-medium capitalize">{tender.tender_type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Estimated Value</p>
                  <p className="font-medium">
                    {tender.estimated_value 
                      ? `€${tender.estimated_value.toLocaleString()}` 
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Publish Date</p>
                  <p className="font-medium">{new Date(tender.publish_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Deadline</p>
                  <p className="font-medium">{new Date(tender.deadline_date).toLocaleDateString()}</p>
                </div>
                {tender.award_date && (
                  <div>
                    <p className="text-sm text-slate-500">Award Date</p>
                    <p className="font-medium">{new Date(tender.award_date).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500">Documents</p>
                  <p className="font-medium">{tender.document_count} attached</p>
                </div>
              </div>

              {tender.cpv_codes && tender.cpv_codes.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">CPV Codes</p>
                  <div className="flex flex-wrap gap-2">
                    {tender.cpv_codes.map((code, idx) => (
                      <Badge key={idx} variant="outline">{code}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {tender.description && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Description</p>
                  <p className="text-slate-700">{tender.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Submissions ({submissions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-slate-500">No submissions yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
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
                            className="font-mono text-sm hover:underline"
                          >
                            {s.submission_reference || "—"}
                          </Link>
                        </TableCell>
                        <TableCell>{s.supplier_company?.name || "—"}</TableCell>
                        <TableCell>
                          {s.bid_amount ? `€${s.bid_amount.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={submissionStatusColors[s.status] || ""}>
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Buyer Info */}
          {tender.buyer_company && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Buyer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{tender.buyer_company.name}</p>
                  <p className="text-sm text-slate-500">{tender.buyer_company.legal_form}</p>
                </div>
                <div className="text-sm text-slate-600">
                  <p>{tender.buyer_company.street}</p>
                  <p>{tender.buyer_company.postcode} {tender.buyer_company.city}</p>
                </div>
                {tender.buyer_company.vat_id && (
                  <p className="text-sm text-slate-500">VAT: {tender.buyer_company.vat_id}</p>
                )}
                <Link 
                  href={`/${currentOrg.slug}/companies/${tender.buyer_company.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View company →
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tender.contact_name && (
                <p className="font-medium">{tender.contact_name}</p>
              )}
              {tender.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a href={`mailto:${tender.contact_email}`} className="text-blue-600 hover:underline">
                    {tender.contact_email}
                  </a>
                </div>
              )}
              {tender.contact_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{tender.contact_phone}</span>
                </div>
              )}
              {!tender.contact_name && !tender.contact_email && !tender.contact_phone && (
                <p className="text-slate-500">No contact information</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
