"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import {
  getCompany,
  getTenders,
  getSubmissions,
  type Company,
  type Tender,
  type TenderSubmission,
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
import { Loader2, ArrowLeft, Building2, MapPin, Phone, Mail, Globe, FileText } from "lucide-react";
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

export default function CompanyDetailPage() {
  const params = useParams();
  const { currentOrg } = useOrg();
  const [company, setCompany] = useState<Company | null>(null);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [submissions, setSubmissions] = useState<TenderSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const companyId = params.id as string;

  async function loadData() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const companyData = await getCompany(companyId);
      setCompany(companyData);

      // Load related data
      if (companyData.is_buyer) {
        const tendersData = await getTenders(currentOrg.id, { buyer_company_id: companyId });
        setTenders(tendersData.tenders);
      }

      if (companyData.is_supplier) {
        const submissionsData = await getSubmissions(currentOrg.id, { supplier_company_id: companyId });
        setSubmissions(submissionsData.submissions);
      }
    } catch {
      toast.error("Failed to load company details");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentOrg, companyId]);

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Company not found</p>
        <Link href={`/${currentOrg.slug}/companies`} className="text-blue-600 hover:underline mt-2 inline-block">
          Back to companies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${currentOrg.slug}/companies`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{company.name}</h2>
          <p className="text-slate-600">{company.legal_form}</p>
        </div>
        <div className="flex gap-2">
          {company.is_buyer && (
            <Badge className="bg-blue-100 text-blue-800">Buyer</Badge>
          )}
          {company.is_supplier && (
            <Badge className="bg-green-100 text-green-800">Supplier</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>{company.street}</p>
              <p>{company.postcode} {company.city}</p>
              <p>{company.state}, {company.country}</p>
            </CardContent>
          </Card>

          {/* Tenders (if buyer) */}
          {company.is_buyer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Published Tenders ({tenders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tenders.length === 0 ? (
                  <p className="text-slate-500">No tenders published</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tender ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Deadline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenders.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <Link
                              href={`/${currentOrg.slug}/tenders/${t.id}`}
                              className="font-mono text-sm hover:underline"
                            >
                              {t.tender_id}
                            </Link>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{t.title}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[t.status] || ""}>
                              {t.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(t.deadline_date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submissions (if supplier) */}
          {company.is_supplier && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submissions ({submissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <p className="text-slate-500">No submissions</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Tender</TableHead>
                        <TableHead>Bid</TableHead>
                        <TableHead>Status</TableHead>
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
                          <TableCell className="max-w-xs truncate">{s.tender?.title || "—"}</TableCell>
                          <TableCell>
                            {s.bid_amount ? `€${s.bid_amount.toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge className={submissionStatusColors[s.status] || ""}>
                              {s.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.vat_id && (
                <div>
                  <p className="text-sm text-slate-500">VAT ID</p>
                  <p className="font-mono">{company.vat_id}</p>
                </div>
              )}
              {company.tax_number && (
                <div>
                  <p className="text-sm text-slate-500">Tax Number</p>
                  <p className="font-mono">{company.tax_number}</p>
                </div>
              )}
              {company.registration_court && (
                <div>
                  <p className="text-sm text-slate-500">Registration Court</p>
                  <p>{company.registration_court}</p>
                </div>
              )}
              {company.hrb_number && (
                <div>
                  <p className="text-sm text-slate-500">HRB Number</p>
                  <p className="font-mono">{company.hrb_number}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{company.phone}</span>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">
                    {company.email}
                  </a>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <a 
                    href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {company.website}
                  </a>
                </div>
              )}
              {!company.phone && !company.email && !company.website && (
                <p className="text-slate-500">No contact information</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
