"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import { getCase, updateCase, type Case } from "@/lib/actions/cases";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  open: "bg-blue-100 text-blue-800",
  in_review: "bg-yellow-100 text-yellow-800",
  needs_correction: "bg-orange-100 text-orange-800",
  closed: "bg-green-100 text-green-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export default function CaseDetailPage() {
  const params = useParams();
  const { currentOrg } = useOrg();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const caseId = params.id as string;

  useEffect(() => {
    async function loadCase() {
      try {
        const data = await getCase(caseId);
        setCaseData(data);
      } catch (error) {
        console.error("Error loading case:", error);
        toast.error("Failed to load case");
      } finally {
        setIsLoading(false);
      }
    }

    loadCase();
  }, [caseId]);

  async function handleStatusChange(newStatus: string | null) {
    if (!caseData || !newStatus) return;
    setIsUpdating(true);
    try {
      const updated = await updateCase(caseId, { status: newStatus as Case["status"] });
      setCaseData(updated);
      toast.success("Status updated");
    } catch (error) {
      console.error("Error updating case:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!caseData) {
    return <div className="text-slate-600">Case not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${currentOrg?.slug}/cases`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{caseData.title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={statusColors[caseData.status] || ""}>
              {caseData.status.replace("_", " ")}
            </Badge>
            <Badge className={priorityColors[caseData.priority] || ""}>
              {caseData.priority}
            </Badge>
            <span className="text-sm text-slate-500 capitalize">
              {caseData.case_type}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Change Status:</span>
          <Select
            value={caseData.status}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="needs_correction">Needs Correction</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 whitespace-pre-wrap">
            {caseData.description || "No description provided."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Case ID</span>
              <span className="font-mono text-sm">{caseData.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Created</span>
              <span>{new Date(caseData.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Updated</span>
              <span>{new Date(caseData.updated_at).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 text-sm">
              Documents linked to this case will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
