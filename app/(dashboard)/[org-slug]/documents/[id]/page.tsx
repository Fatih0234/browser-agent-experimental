"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import {
  getDocument,
  getDocumentVersions,
  uploadNewVersion,
  getSignedUrl,
  type DocumentWithVersion,
  type DocumentVersion,
} from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Download, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const mimeTypeLabels: Record<string, string> = {
  "application/pdf": "PDF",
  "text/csv": "CSV",
  "text/plain": "TXT",
  "application/json": "JSON",
  "image/png": "PNG",
  "image/jpeg": "JPG",
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function DocumentDetailPage() {
  const params = useParams();
  const { currentOrg } = useOrg();
  const [document, setDocument] = useState<DocumentWithVersion | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const docId = params.id as string;

  async function loadData() {
    try {
      const [docData, versionsData] = await Promise.all([
        getDocument(docId),
        getDocumentVersions(docId),
      ]);
      setDocument(docData);
      setVersions(versionsData);
    } catch (error) {
      console.error("Error loading document:", error);
      toast.error("Failed to load document");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [docId]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      await uploadNewVersion(docId, {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        arrayBuffer,
      });
      toast.success("New version uploaded successfully");
      setIsUploadOpen(false);
      // Reload data
      await loadData();
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Error uploading version:", error);
      toast.error(error.message || "Failed to upload version");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(version: DocumentVersion) {
    try {
      const url = await getSignedUrl(version.storage_path);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error getting download URL:", error);
      toast.error("Failed to get download URL");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!document) {
    return <div className="text-slate-600">Document not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${currentOrg?.slug}/documents`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{document.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              {mimeTypeLabels[document.mime_type] || document.mime_type}
            </Badge>
            {document.latest_version && (
              <span className="text-sm text-slate-500">
                {formatFileSize(document.latest_version.file_size)}
              </span>
            )}
          </div>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Version
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleUpload}>
              <DialogHeader>
                <DialogTitle>Upload New Version</DialogTitle>
                <DialogDescription>
                  Upload a new version of {document.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.csv,.txt,.json,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Max size: 25MB. Current type: {document.mime_type}
                  </p>
                </div>
                {selectedFile && (
                  <div className="text-sm text-slate-600">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isUploading || !selectedFile}>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Version"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {document.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{document.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-slate-500">No versions found.</p>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    version.id === document.latest_version_id
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Version {version.version_number}</span>
                      {version.id === document.latest_version_id && (
                        <Badge className="bg-blue-100 text-blue-800">Latest</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {formatFileSize(version.file_size)} •{" "}
                      {new Date(version.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(version)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
