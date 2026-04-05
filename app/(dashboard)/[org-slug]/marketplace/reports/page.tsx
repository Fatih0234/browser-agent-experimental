"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import {
  getReports,
  getReportDownloadUrl,
  generateOrdersReportCsv,
  type MarketplaceReport,
  type Marketplace,
} from "@/lib/actions/marketplace";
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
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const marketplaceColors: Record<string, string> = {
  amazon: "bg-orange-100 text-orange-800",
  ebay: "bg-blue-100 text-blue-800",
  otto: "bg-red-100 text-red-800",
};

const reportTypeLabels: Record<string, string> = {
  orders: "Orders Report",
  payments: "Payments Report",
  performance: "Performance Report",
};

const MARKETPLACES: Marketplace[] = ["amazon", "ebay", "otto"];

export default function ReportsPage() {
  const { currentOrg } = useOrg();
  const [reports, setReports] = useState<MarketplaceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marketplaceFilter, setMarketplaceFilter] = useState<Marketplace | "all">("all");
  const [generatingFor, setGeneratingFor] = useState<Marketplace | null>(null);

  async function loadReports() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const data = await getReports(currentOrg.id, {
        marketplace: marketplaceFilter !== "all" ? marketplaceFilter : undefined,
      });
      setReports(data);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadReports(); }, [currentOrg, marketplaceFilter]);

  async function handleDownload(reportId: string) {
    try {
      const url = await getReportDownloadUrl(reportId);
      window.open(url, "_blank");
    } catch {
      toast.error("Failed to get download link");
    }
  }

  async function handleGenerateCsv(marketplace: Marketplace) {
    if (!currentOrg) return;
    setGeneratingFor(marketplace);
    try {
      const csv = await generateOrdersReportCsv(currentOrg.id, marketplace);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${marketplace}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${marketplace.toUpperCase()} orders report downloaded`);
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setGeneratingFor(null);
    }
  }

  if (!currentOrg) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/marketplace`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
          <p className="text-slate-600">Download and generate marketplace reports</p>
        </div>
      </div>

      {/* Live report generation */}
      <Card>
        <CardHeader><CardTitle>Generate Live Orders Report</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">Generate a CSV report from current order data for any marketplace.</p>
          <div className="flex gap-3">
            {MARKETPLACES.map((mp) => (
              <Button
                key={mp}
                variant="outline"
                onClick={() => handleGenerateCsv(mp)}
                disabled={generatingFor === mp}
              >
                {generatingFor === mp ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                {mp.toUpperCase()} Orders CSV
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stored reports */}
      <div className="flex gap-3">
        <Select value={marketplaceFilter} onValueChange={(v) => setMarketplaceFilter(v as Marketplace | "all")}>
          <SelectTrigger className="w-36" id="reports-marketplace-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="amazon">Amazon</SelectItem>
            <SelectItem value="ebay">eBay</SelectItem>
            <SelectItem value="otto">OTTO</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle>Stored Reports ({reports.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No stored reports. Seed the scenario to generate sample reports.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge className={marketplaceColors[r.marketplace] || ""}>{r.marketplace.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>{reportTypeLabels[r.report_type] || r.report_type}</TableCell>
                    <TableCell>
                      {new Date(r.period_start).toLocaleDateString()} – {new Date(r.period_end).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{new Date(r.generated_at).toLocaleString()}</TableCell>
                    <TableCell>
                      {r.storage_path && (
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(r.id)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </TableCell>
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
