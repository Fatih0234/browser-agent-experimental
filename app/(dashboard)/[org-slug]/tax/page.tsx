"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import { getTaxFilings, getDisclosures, type TaxFiling, type Disclosure } from "@/lib/actions/tax";
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
import { Loader2, FileText, Building2, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const filingStatusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  submitted: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  correction_needed: "bg-yellow-100 text-yellow-800",
};

const disclosureStatusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  submitted: "bg-blue-100 text-blue-800",
  published: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function TaxDashboardPage() {
  const { currentOrg } = useOrg();
  const [filings, setFilings] = useState<TaxFiling[]>([]);
  const [disclosures, setDisclosures] = useState<Disclosure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingFilings, setUpcomingFilings] = useState<TaxFiling[]>([]);

  async function loadData() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const [filingsData, disclosuresData] = await Promise.all([
        getTaxFilings(currentOrg.id, { page: 1, pageSize: 5 }),
        getDisclosures(currentOrg.id, { page: 1, pageSize: 5 }),
      ]);
      setFilings(filingsData.filings);
      setDisclosures(disclosuresData.disclosures);

      // Calculate upcoming filings (due within 30 days and not submitted)
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const upcoming = filingsData.filings.filter(
        (f) => f.status === "draft" && new Date(f.due_date) <= thirtyDaysFromNow
      );
      setUpcomingFilings(upcoming);
    } catch {
      toast.error("Failed to load tax data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentOrg]);

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tax & Disclosure</h2>
        <p className="text-slate-600">ELSTER and Bundesanzeiger portal simulation</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Tax Filings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filings.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {filings.filter((f) => f.status === "draft").length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Disclosures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{disclosures.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {disclosures.filter((d) => d.status === "published").length} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingFilings.length}</div>
            <p className="text-xs text-slate-500 mt-1">Due within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines Alert */}
      {upcomingFilings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingFilings.map((filing) => {
                const daysLeft = Math.ceil(
                  (new Date(filing.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={filing.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-yellow-900">{filing.filing_reference}</p>
                      <p className="text-sm text-yellow-700">
                        {filing.filing_type} - {filing.filing_period}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-yellow-900">
                        {daysLeft <= 0 ? "Overdue" : `${daysLeft} days left`}
                      </p>
                      <p className="text-sm text-yellow-700">
                        Due: {new Date(filing.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tax Filings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Tax Filings
            </CardTitle>
            <Link href={`/${currentOrg.slug}/tax/filings`}>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filings.length === 0 ? (
              <p className="text-slate-500">No tax filings found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filings.slice(0, 5).map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <Link
                          href={`/${currentOrg.slug}/tax/filings/${f.id}`}
                          className="font-mono text-sm hover:underline"
                        >
                          {f.filing_reference}
                        </Link>
                      </TableCell>
                      <TableCell>{f.filing_type}</TableCell>
                      <TableCell>
                        <Badge className={filingStatusColors[f.status] || ""}>
                          {f.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(f.due_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Disclosures */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Recent Disclosures
            </CardTitle>
            <Link href={`/${currentOrg.slug}/tax/disclosures`}>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : disclosures.length === 0 ? (
              <p className="text-slate-500">No disclosures found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disclosures.slice(0, 5).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Link
                          href={`/${currentOrg.slug}/tax/disclosures/${d.id}`}
                          className="font-mono text-sm hover:underline"
                        >
                          {d.disclosure_reference}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{d.title}</TableCell>
                      <TableCell>
                        <Badge className={disclosureStatusColors[d.status] || ""}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {d.publication_date 
                          ? new Date(d.publication_date).toLocaleDateString() 
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
    </div>
  );
}
