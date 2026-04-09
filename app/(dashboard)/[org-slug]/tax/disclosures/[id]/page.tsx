"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import {
  getDisclosure,
  updateDisclosure,
  submitDisclosure,
  type Disclosure,
  type DisclosureStatus,
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
import { Loader2, ArrowLeft, Building2, FileText, Send, Globe } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

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

export default function DisclosureDetailPage() {
  const params = useParams();
  const { currentOrg } = useOrg();
  const [disclosure, setDisclosure] = useState<Disclosure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const disclosureId = params.id as string;

  async function loadDisclosure() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const data = await getDisclosure(disclosureId);
      setDisclosure(data);
    } catch {
      toast.error("Failed to load disclosure");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDisclosure();
  }, [currentOrg, disclosureId]);

  async function handleStatusChange(newStatus: DisclosureStatus) {
    if (!disclosure) return;
    setIsUpdating(true);
    try {
      await updateDisclosure(disclosure.id, { status: newStatus });
      toast.success(`Disclosure status updated to ${newStatus}`);
      loadDisclosure();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSubmit() {
    if (!disclosure) return;
    setIsUpdating(true);
    try {
      await submitDisclosure(disclosure.id);
      toast.success("Disclosure submitted successfully");
      loadDisclosure();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit disclosure");
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

  if (!disclosure) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Disclosure not found</p>
        <Link href={`/${currentOrg.slug}/tax/disclosures`} className="text-blue-600 hover:underline mt-2 inline-block">
          Back to disclosures
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${currentOrg.slug}/tax/disclosures`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{disclosure.title}</h2>
            <p className="text-slate-600">{disclosure.disclosure_reference}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusColors[disclosure.status] || ""}>
            {disclosure.status}
          </Badge>
          {disclosure.status === "draft" && (
            <Button onClick={handleSubmit} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit
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
                Disclosure Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <p className="font-medium">{typeLabels[disclosure.disclosure_type]}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Reference</p>
                  <p className="font-mono">{disclosure.disclosure_reference}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="font-medium">{new Date(disclosure.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Documents</p>
                  <p className="font-medium">{disclosure.document_count} attached</p>
                </div>
              </div>

              {disclosure.description && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Description</p>
                  <div className="bg-slate-50 p-4 rounded-md">
                    <p className="text-slate-700 whitespace-pre-wrap">{disclosure.description}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          {disclosure.company && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{disclosure.company.name}</p>
                  <p className="text-sm text-slate-500">{disclosure.company.legal_form}</p>
                </div>
                <div className="text-sm text-slate-600">
                  <p>{disclosure.company.street}</p>
                  <p>{disclosure.company.postcode} {disclosure.company.city}</p>
                </div>
                {disclosure.company.vat_id && (
                  <p className="text-sm text-slate-500">VAT: {disclosure.company.vat_id}</p>
                )}
                <Link 
                  href={`/${currentOrg.slug}/companies/${disclosure.company.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View company →
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Publication Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Publication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {disclosure.publication_date && (
                <div>
                  <p className="text-sm text-slate-500">Publication Date</p>
                  <p className="font-medium">{new Date(disclosure.publication_date).toLocaleDateString()}</p>
                </div>
              )}
              {disclosure.bundesanzeiger_id && (
                <div>
                  <p className="text-sm text-slate-500">Bundesanzeiger ID</p>
                  <p className="font-mono text-sm">{disclosure.bundesanzeiger_id}</p>
                </div>
              )}
              {!disclosure.publication_date && !disclosure.bundesanzeiger_id && (
                <p className="text-slate-500">Not yet published</p>
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
                  value={disclosure.status}
                  onValueChange={(v) => handleStatusChange(v as DisclosureStatus)}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
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
