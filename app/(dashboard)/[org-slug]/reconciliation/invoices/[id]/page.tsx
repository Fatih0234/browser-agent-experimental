"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import {
  getUnifiedInvoice,
  matchInvoice,
  flagInvoice,
  type InvoiceSource,
  type ReconciliationMatch,
} from "@/lib/actions/reconciliation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-800",
  matched: "bg-green-100 text-green-800",
  flagged: "bg-red-100 text-red-800",
  dismissed: "bg-slate-100 text-slate-500",
};

type InvoiceDetail = {
  id: string;
  invoice_source: InvoiceSource;
  reference: string;
  portal_label: string;
  amount: number;
  currency: string;
  issued_at: string;
  reconciliation_id: string | null;
  reconciliation_status: string;
  amount_delta: number | null;
  flagged_reason: string | null;
  match: ReconciliationMatch | null;
  sourceData: Record<string, unknown>;
};

export default function InvoiceDetailPage() {
  const { currentOrg } = useOrg();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const source = (searchParams.get("source") ?? "shipment") as InvoiceSource;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Match form
  const [matchExpected, setMatchExpected] = useState("");
  const [matchType, setMatchType] = useState<"exact" | "partial" | "estimated">("exact");
  const [matchNotes, setMatchNotes] = useState("");

  // Flag form
  const [flagReason, setFlagReason] = useState("");
  const [flagExpected, setFlagExpected] = useState("");
  const [flagNotes, setFlagNotes] = useState("");

  async function load() {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await getUnifiedInvoice(id, source);
      setInvoice(data as InvoiceDetail);
      if (data.amount_delta !== null && data.match?.expected_amount) {
        setMatchExpected(data.match.expected_amount.toString());
        setFlagExpected(data.match.expected_amount.toString());
      }
    } catch {
      toast.error("Failed to load invoice");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id, source]);

  async function handleMatch() {
    if (!currentOrg || !invoice) return;
    const expected = parseFloat(matchExpected);
    if (isNaN(expected)) { toast.error("Enter a valid expected amount"); return; }
    setIsSubmitting(true);
    try {
      await matchInvoice(currentOrg.id, id, source, {
        expected_amount: expected,
        match_type: matchType,
        notes: matchNotes || undefined,
      });
      toast.success("Invoice matched");
      await load();
    } catch {
      toast.error("Failed to match invoice");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFlag() {
    if (!currentOrg || !invoice) return;
    if (!flagReason.trim()) { toast.error("Enter a reason for flagging"); return; }
    setIsSubmitting(true);
    try {
      await flagInvoice(currentOrg.id, id, source, {
        flagged_reason: flagReason,
        expected_amount: flagExpected ? parseFloat(flagExpected) : undefined,
        notes: flagNotes || undefined,
      });
      toast.success("Invoice flagged");
      await load();
    } catch {
      toast.error("Failed to flag invoice");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentOrg) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-slate-600">Invoice not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/reconciliation/invoices`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-mono">{invoice.reference}</h2>
          <p className="text-slate-600 capitalize">{invoice.portal_label} · {invoice.invoice_source}</p>
        </div>
      </div>

      {/* Invoice details */}
      <Card>
        <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Reference</dt>
              <dd className="font-mono font-medium">{invoice.reference}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Portal</dt>
              <dd><Badge variant="outline">{invoice.portal_label}</Badge></dd>
            </div>
            <div>
              <dt className="text-slate-500">Amount</dt>
              <dd className="font-bold text-lg">
                {invoice.amount.toLocaleString("de-DE", { style: "currency", currency: invoice.currency })}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Date</dt>
              <dd className="font-medium">{new Date(invoice.issued_at).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Reconciliation Status</dt>
              <dd>
                <Badge className={statusColors[invoice.reconciliation_status] || ""}>
                  {invoice.reconciliation_status}
                </Badge>
              </dd>
            </div>
            {invoice.amount_delta !== null && (
              <div>
                <dt className="text-slate-500">Amount Delta</dt>
                <dd className={`font-medium ${invoice.amount_delta === 0 ? "text-green-600" : "text-red-600"}`}>
                  {invoice.amount_delta > 0 ? "+" : ""}{invoice.amount_delta.toFixed(2)} {invoice.currency}
                </dd>
              </div>
            )}
            {invoice.flagged_reason && (
              <div className="col-span-2">
                <dt className="text-slate-500">Flag Reason</dt>
                <dd className="font-medium text-red-700">{invoice.flagged_reason}</dd>
              </div>
            )}
            {invoice.match?.notes && (
              <div className="col-span-2">
                <dt className="text-slate-500">Notes</dt>
                <dd className="font-medium">{invoice.match.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Actions — only show if not already matched */}
      {invoice.reconciliation_status !== "dismissed" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Match action */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Mark as Matched
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="expected-amount">Expected Amount (EUR)</Label>
                <Input
                  id="expected-amount"
                  type="number"
                  step="0.01"
                  placeholder={invoice.amount.toFixed(2)}
                  value={matchExpected}
                  onChange={(e) => setMatchExpected(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="match-type">Match Type</Label>
                <Select value={matchType} onValueChange={(v) => setMatchType(v as typeof matchType)}>
                  <SelectTrigger id="match-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact">Exact</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="estimated">Estimated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="match-notes">Notes (optional)</Label>
                <Textarea
                  id="match-notes"
                  rows={2}
                  placeholder="Add a note..."
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                />
              </div>
              <Button
                onClick={handleMatch}
                disabled={isSubmitting}
                className="w-full"
                id="match-invoice-btn"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Match"}
              </Button>
            </CardContent>
          </Card>

          {/* Flag action */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Flag Discrepancy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="flag-reason">Reason *</Label>
                <Input
                  id="flag-reason"
                  placeholder="e.g. Amount mismatch, duplicate invoice"
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="flag-expected">Expected Amount (optional)</Label>
                <Input
                  id="flag-expected"
                  type="number"
                  step="0.01"
                  placeholder="Leave blank if unknown"
                  value={flagExpected}
                  onChange={(e) => setFlagExpected(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="flag-notes">Notes (optional)</Label>
                <Textarea
                  id="flag-notes"
                  rows={2}
                  placeholder="Add context..."
                  value={flagNotes}
                  onChange={(e) => setFlagNotes(e.target.value)}
                />
              </div>
              <Button
                variant="destructive"
                onClick={handleFlag}
                disabled={isSubmitting}
                className="w-full"
                id="flag-invoice-btn"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Flag Discrepancy"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
