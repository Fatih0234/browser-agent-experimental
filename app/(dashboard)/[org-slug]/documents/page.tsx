"use client";

import { useEffect, useState, useCallback } from "react";
import { useOrg } from "@/lib/org-context";
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  getSignedUrl,
  type DocumentWithVersion,
} from "@/lib/actions/documents";
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
import { Plus, Loader2, Download, Trash2, FileText } from "lucide-react";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";

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

export default function DocumentsPage() {
  const { currentOrg, isAdmin } = useOrg();
  const [documents, setDocuments] = useState<DocumentWithVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [description, setDescription] = useState("");

  const loadDocuments = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const data = await getDocuments(currentOrg.id);
      setDocuments(data);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg || !selectedFile) return;

    setIsUploading(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      await uploadDocument(
        currentOrg.id,
        {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          arrayBuffer,
        },
        { description }
      );
      toast.success("Document uploaded successfully");
      setIsCreateOpen(false);
      // Reload documents
      await loadDocuments();
      // Reset form
      setSelectedFile(null);
      setDescription("");
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(doc: DocumentWithVersion) {
    if (!doc.latest_version) return;
    try {
      const url = await getSignedUrl(doc.latest_version.storage_path);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error getting download URL:", error);
      toast.error("Failed to get download URL");
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(docId);
      toast.success("Document deleted");
      await loadDocuments();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error(error.message || "Failed to delete document");
    }
  }

  if (!currentOrg) {
    return <div className="text-slate-600">No organization selected</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Documents</h2>
          <p className="text-slate-600">
            Upload and manage documents for {currentOrg.name}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleUpload}>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a document to {currentOrg.name}
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
                    Max size: 25MB. Allowed: PDF, CSV, TXT, JSON, PNG, JPG
                  </p>
                </div>
                {selectedFile && (
                  <div className="text-sm text-slate-600">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter document description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isUploading || !selectedFile}>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No documents yet. Upload your first document to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Versions</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {mimeTypeLabels[doc.mime_type] || doc.mime_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {doc.latest_version
                        ? formatFileSize(doc.latest_version.file_size)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/${currentOrg.slug}/documents/${doc.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        v{doc.latest_version?.version_number || 1}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          disabled={!doc.latest_version}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
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
