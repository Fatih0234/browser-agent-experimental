"use client";

import { useState } from "react";
import { useOrg } from "@/lib/org-context";
import { createTender, getCompanies, type Company, type TenderType } from "@/lib/actions/tenders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewTenderPage() {
  const { currentOrg } = useOrg();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [buyerCompanies, setBuyerCompanies] = useState<Company[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tenderType, setTenderType] = useState<TenderType>("open");
  const [buyerCompanyId, setBuyerCompanyId] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [cpvCodes, setCpvCodes] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Load buyer companies on mount
  useState(() => {
    if (!currentOrg) return;
    getCompanies(currentOrg.id, { is_buyer: true })
      .then((result) => {
        setBuyerCompanies(result.companies);
      })
      .catch(() => {
        toast.error("Failed to load companies");
      });
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;

    setIsLoading(true);
    try {
      const cpvCodesArray = cpvCodes
        .split(",")
        .map((code) => code.trim())
        .filter((code) => code.length > 0);

      await createTender(currentOrg.id, {
        title,
        description: description || undefined,
        tender_type: tenderType,
        buyer_company_id: buyerCompanyId || undefined,
        estimated_value: estimatedValue ? parseFloat(estimatedValue) : undefined,
        cpv_codes: cpvCodesArray.length > 0 ? cpvCodesArray : undefined,
        publish_date: publishDate,
        deadline_date: deadlineDate,
        contact_name: contactName || undefined,
        contact_email: contactEmail || undefined,
        contact_phone: contactPhone || undefined,
      });

      toast.success("Tender created successfully");
      router.push(`/${currentOrg.slug}/tenders`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create tender");
    } finally {
      setIsLoading(false);
    }
  }

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

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
        <h2 className="text-2xl font-bold text-slate-900">Create New Tender</h2>
        <p className="text-slate-600">Publish a new public procurement notice</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tender Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Neubau Verwaltungsgebäude"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the tender requirements..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tender_type">Tender Type *</Label>
                <Select value={tenderType} onValueChange={(v) => setTenderType(v as TenderType)}>
                  <SelectTrigger id="tender_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="negotiated">Negotiated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyer_company">Buyer Company</Label>
                <Select value={buyerCompanyId} onValueChange={(v) => setBuyerCompanyId(v || "")}>
                  <SelectTrigger id="buyer_company">
                    <SelectValue placeholder="Select buyer company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {buyerCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_value">Estimated Value (€)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="e.g., 50000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpv_codes">CPV Codes (comma-separated)</Label>
                <Input
                  id="cpv_codes"
                  value={cpvCodes}
                  onChange={(e) => setCpvCodes(e.target.value)}
                  placeholder="e.g., 45233141-5, 30125100-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publish_date">Publish Date *</Label>
                <Input
                  id="publish_date"
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline_date">Deadline Date *</Label>
                <Input
                  id="deadline_date"
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g., Herr Müller"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g., contact@company.de"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g., +49 30 12345678"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Tender
              </>
            )}
          </Button>
          <Link href={`/${currentOrg.slug}/tenders`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
