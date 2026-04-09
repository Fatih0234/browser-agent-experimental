"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import {
  getDeclaration,
  getCustomsDocuments,
  getCustomsExceptions,
  updateDeclarationStatus,
  uploadCustomsDocument,
  type CustomsDeclaration,
  type CustomsDocument,
  type CustomsException,
  type DeclarationStatus,
} from "@/lib/actions/customs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  cleared: "bg-green-100 text-green-800",
  exception: "bg-red-100 text-red-800",
};

const severityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export default function DeclarationDetailPage() {
  const { currentOrg } = useOrg();
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [declaration, setDeclaration] = useState<CustomsDeclaration | null>(null);
  const [documents, setDocuments] = useState<CustomsDocument[]>([]);
  const [exceptions, setExceptions] = useState<CustomsException[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function load() {
    if (!currentOrg) return;
    try {
      const [decl, docs, excResult] = await Promise.all([
        getDeclaration(currentOrg.id, id),
        getCustomsDocuments(currentOrg.id, id),
        getCustomsExceptions(currentOrg.id, { status: "open", pageSize: 50 }),
      ]);
      setDeclaration(decl);
      setDocuments(docs);
      setExceptions(excResult.exceptions.filter((e) => e.declaration_id === id));
    } catch {
      toast.error("Failed to load declaration");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [currentOrg, id]);

  async function handleStatusChange(status: DeclarationStatus) {
    if (!currentOrg || !declaration) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updateDeclarationStatus(currentOrg.id, id, status);
      setDeclaration(updated);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentOrg) return;
    setIsUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      await uploadCustomsDocument(
        currentOrg.id,
        id,
        { name: file.name, type: file.type, arrayBuffer },
        "other"
      );
      toast.success("Document uploaded");
      const updated = await getCustomsDocuments(currentOrg.id, id);
      setDocuments(updated);
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!currentOrg) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!declaration) {
    return <p className="text-slate-500">Declaration not found.</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/customs`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />Back
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 font-mono">{declaration.reference_number}</h2>
          <p className="text-slate-600 capitalize">{declaration.declaration_type} declaration</p>
        </div>
        <Badge className={statusColors[declaration.status] ?? "bg-slate-100 text-slate-800"}>
          {declaration.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Declaration info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Declaration Details</CardTitle>
            <div className="flex items-center gap-2">
              {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
              <Select
                value={declaration.status}
                onValueChange={(v) => handleStatusChange(v as DeclarationStatus)}
              >
                <SelectTrigger id="status-update" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="exception">Exception</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Type</dt>
              <dd className="font-medium capitalize">{declaration.declaration_type}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Transport Mode</dt>
              <dd className="font-medium capitalize">{declaration.transport_mode ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Origin Country</dt>
              <dd className="font-medium">{declaration.origin_country ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Destination Country</dt>
              <dd className="font-medium">{declaration.destination_country ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">HS Code</dt>
              <dd className="font-mono font-medium">{declaration.hs_code ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Incoterms</dt>
              <dd className="font-medium">{declaration.incoterms ?? "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">Commodity Description</dt>
              <dd className="font-medium">{declaration.commodity_description ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Quantity</dt>
              <dd className="font-medium">
                {declaration.quantity != null ? `${declaration.quantity} ${declaration.unit_of_measure ?? ""}`.trim() : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Declared Value</dt>
              <dd className="font-medium">
                {declaration.declared_value_eur != null
                  ? `€${Number(declaration.declared_value_eur).toLocaleString("de-DE", { minimumFractionDigits: 2 })} ${declaration.currency}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Exporter</dt>
              <dd className="font-medium">{declaration.exporter_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Importer</dt>
              <dd className="font-medium">{declaration.importer_name ?? "—"}</dd>
            </div>
            {declaration.customs_office && (
              <div className="col-span-2">
                <dt className="text-slate-500">Customs Office</dt>
                <dd className="font-medium">{declaration.customs_office}</dd>
              </div>
            )}
            {declaration.notes && (
              <div className="col-span-2">
                <dt className="text-slate-500">Notes</dt>
                <dd className="text-slate-700">{declaration.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Supporting Documents</CardTitle>
            <div>
              <input
                ref={fileInputRef}
                id="document-upload"
                type="file"
                className="hidden"
                accept=".pdf,.csv,.txt,.xlsx,.docx"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Document
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-slate-500 text-sm">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{doc.filename}</p>
                    <p className="text-xs text-slate-500">
                      {doc.document_type.replace(/_/g, " ")} ·{" "}
                      {new Date(doc.created_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exceptions */}
      {exceptions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Open Exceptions
              </CardTitle>
              <Link href={`/${currentOrg.slug}/customs/exceptions`}>
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exceptions.map((exc) => (
                <div key={exc.id} className="flex items-start justify-between p-3 border rounded-lg border-red-200 bg-red-50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">[{exc.exception_code}] {exc.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(exc.created_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <Badge className={severityColors[exc.severity]}>
                    {exc.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
