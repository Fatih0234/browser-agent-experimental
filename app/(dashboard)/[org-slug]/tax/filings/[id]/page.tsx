"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import {
  getTaxFiling,
  updateTaxFiling,
  submitTaxFiling,
  type TaxFiling,
  type FilingStatus,
} from "@/lib/actions/tax";
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
import { Loader2, ArrowLeft, Building2, FileText, Euro, Send, Shield } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  submitted: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  correction_needed: "bg-yellow-100 text-yellow-800",
};

export default function TaxFilingDetailPage() {
  const params = useParams();
  const { currentOrg } = useOrg();
  const [filing, setFiling] = useState<TaxFiling | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const filingId = params.id as string;

  async function loadFiling() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const data = await getTaxFiling(filingId);
      setFiling(data);
    } catch {
      toast.error("Failed to load tax filing");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFiling();
  }, [currentOrg, filingId]);

  async function handleStatusChange(newStatus: FilingStatus) {
    if (!filing) return;
    setIsUpdating(true);
    try {
      await updateTaxFiling(filing.id, { status: newStatus });
      toast.success(`Filing status updated to ${newStatus}`);
      loadFiling();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSubmit() {
    if (!filing) return;
    setIsUpdating(true);
    try {
      await submitTaxFiling(filing.id);
      toast.success("Tax filing submitted successfully");
      loadFiling();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit filing");
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

  if (!filing) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Tax filing not found</p>
        <Link href={`/${currentOrg.slug}/tax/filings`} className="text-blue-600 hover:underline mt-2 inline-block">
          Back to filings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${currentOrg.slug}/tax/filings`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{filing.filing_reference}</h2>
            <p className="text-slate-600">{filing.filing_type}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusColors[filing.status] || ""}>
            {filing.status.replace("_", " ")}
          </Badge>
          {filing.status === "draft" && (
            <Button onClick={handleSubmit} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit to ELSTER
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
                Filing Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Filing Type</p>
                  <p className="font-medium">{filing.filing_type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Period</p>
                  <p className="font-medium">{filing.filing_period}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Period Start</p>
                  <p className="font-medium">{new Date(filing.period_start).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Period End</p>
                  <p className="font-medium">{new Date(filing.period_end).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Due Date</p>
                  <p className="font-medium">{new Date(filing.due_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Submitted At</p>
                  <p className="font-medium">
                    {filing.submitted_at 
                      ? new Date(filing.submitted_at).toLocaleString() 
                      : "Not submitted"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Financial Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500">Revenue</p>
                  <p className="text-xl font-semibold">
                    {filing.revenue ? `€${filing.revenue.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500">VAT Amount</p>
                  <p className="text-xl font-semibold">
                    {filing.vat_amount ? `€${filing.vat_amount.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${filing.tax_payable && filing.tax_payable > 0 ? "bg-red-50" : "bg-green-50"}`}>
                  <p className="text-sm text-slate-500">Tax Payable</p>
                  <p className={`text-xl font-semibold ${filing.tax_payable && filing.tax_payable > 0 ? "text-red-600" : "text-green-600"}`}>
                    {filing.tax_payable ? `€${filing.tax_payable.toLocaleString()}` : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          {filing.company && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{filing.company.name}</p>
                  <p className="text-sm text-slate-500">{filing.company.legal_form}</p>
                </div>
                <div className="text-sm text-slate-600">
                  <p>{filing.company.street}</p>
                  <p>{filing.company.postcode} {filing.company.city}</p>
                </div>
                {filing.company.vat_id && (
                  <p className="text-sm text-slate-500">VAT: {filing.company.vat_id}</p>
                )}
                <Link 
                  href={`/${currentOrg.slug}/companies/${filing.company.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View company →
                </Link>
              </CardContent>
            </Card>
          )}

          {/* ELSTER Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                ELSTER Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filing.elster_tax_number && (
                <div>
                  <p className="text-sm text-slate-500">Tax Number</p>
                  <p className="font-mono">{filing.elster_tax_number}</p>
                </div>
              )}
              {filing.certificate_id && (
                <div>
                  <p className="text-sm text-slate-500">Certificate ID</p>
                  <p className="font-mono text-sm">{filing.certificate_id}</p>
                </div>
              )}
              {!filing.elster_tax_number && !filing.certificate_id && (
                <p className="text-slate-500">No ELSTER information available</p>
              )}
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={filing.status}
                  onValueChange={(v) => handleStatusChange(v as FilingStatus)}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="correction_needed">Correction Needed</SelectItem>
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
