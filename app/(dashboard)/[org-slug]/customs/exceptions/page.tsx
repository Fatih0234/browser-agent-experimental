"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useOrg } from "@/lib/org-context";
import {
  getCustomsExceptions,
  resolveException,
  type CustomsException,
  type ExceptionSeverity,
  type ExceptionStatus,
} from "@/lib/actions/customs";
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
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const severityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
  open: "bg-orange-100 text-orange-800",
  resolved: "bg-green-100 text-green-800",
};

export default function CustomsExceptionsPage() {
  const { currentOrg } = useOrg();
  const [exceptions, setExceptions] = useState<CustomsException[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<ExceptionSeverity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ExceptionStatus | "all">("all");

  const pageSize = 15;

  async function load() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const result = await getCustomsExceptions(currentOrg.id, {
        severity: severityFilter,
        status: statusFilter,
        page,
        pageSize,
      });
      setExceptions(result.exceptions);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load exceptions");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [currentOrg, severityFilter, statusFilter, page]);

  async function handleResolve(exceptionId: string) {
    if (!currentOrg) return;
    setResolvingId(exceptionId);
    try {
      await resolveException(currentOrg.id, exceptionId);
      toast.success("Exception resolved");
      await load();
    } catch {
      toast.error("Failed to resolve exception");
    } finally {
      setResolvingId(null);
    }
  }

  if (!currentOrg) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/customs`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />Back
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Exception Queue</h2>
          <p className="text-slate-600">Customs declarations requiring attention</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Select
              value={severityFilter}
              onValueChange={(v) => { setSeverityFilter(v as ExceptionSeverity | "all"); setPage(1); }}
            >
              <SelectTrigger id="severity-filter" className="w-36">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v as ExceptionStatus | "all"); setPage(1); }}
            >
              <SelectTrigger id="exception-status-filter" className="w-32">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-500 ml-auto">{total} exception{total !== 1 ? "s" : ""}</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : exceptions.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No exceptions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Code</th>
                    <th className="pb-3 pr-4 font-medium">Description</th>
                    <th className="pb-3 pr-4 font-medium">Severity</th>
                    <th className="pb-3 pr-4 font-medium">Declaration</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exceptions.map((exc) => (
                    <tr key={exc.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-mono text-xs text-slate-700">{exc.exception_code}</td>
                      <td className="py-3 pr-4 text-slate-800">{exc.description}</td>
                      <td className="py-3 pr-4">
                        <Badge className={severityColors[exc.severity]}>
                          {exc.severity}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/${currentOrg.slug}/customs/${exc.declaration_id}`}
                          className="text-blue-600 hover:underline text-xs font-mono"
                        >
                          View
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge className={statusColors[exc.status]}>
                          {exc.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {exc.status === "open" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolve(exc.id)}
                            disabled={resolvingId === exc.id}
                          >
                            {resolvingId === exc.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <><CheckCircle className="h-3 w-3 mr-1" />Resolve</>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > pageSize && (
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-slate-500 self-center">
                Page {page} of {Math.ceil(total / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
