"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useOrg } from "@/lib/org-context";
import {
  getDeclarations,
  type CustomsDeclaration,
  type DeclarationStatus,
  type DeclarationType,
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
import { Loader2, Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  cleared: "bg-green-100 text-green-800",
  exception: "bg-red-100 text-red-800",
};

const typeLabels: Record<string, string> = {
  export: "Export",
  import: "Import",
  transit: "Transit",
};

export default function CustomsPage() {
  const { currentOrg } = useOrg();
  const [declarations, setDeclarations] = useState<CustomsDeclaration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DeclarationStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<DeclarationType | "all">("all");

  const pageSize = 15;

  useEffect(() => {
    async function load() {
      if (!currentOrg) return;
      setIsLoading(true);
      try {
        const result = await getDeclarations(currentOrg.id, {
          status: statusFilter,
          declaration_type: typeFilter,
          page,
          pageSize,
        });
        setDeclarations(result.declarations);
        setTotal(result.total);
      } catch {
        toast.error("Failed to load declarations");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentOrg, statusFilter, typeFilter, page]);

  if (!currentOrg) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Customs & Export</h2>
          <p className="text-slate-600">Manage customs declarations and export entries</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${currentOrg.slug}/customs/exceptions`}>
            <Button variant="outline" size="sm">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Exceptions
            </Button>
          </Link>
          <Link href={`/${currentOrg.slug}/customs/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Declaration
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v as DeclarationStatus | "all"); setPage(1); }}
            >
              <SelectTrigger id="status-filter" className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="cleared">Cleared</SelectItem>
                <SelectItem value="exception">Exception</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(v) => { setTypeFilter(v as DeclarationType | "all"); setPage(1); }}
            >
              <SelectTrigger id="type-filter" className="w-36">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="transit">Transit</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-500 ml-auto">{total} declaration{total !== 1 ? "s" : ""}</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : declarations.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No declarations found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Reference</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">HS Code</th>
                    <th className="pb-3 pr-4 font-medium">Value (EUR)</th>
                    <th className="pb-3 pr-4 font-medium">Destination</th>
                    <th className="pb-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {declarations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/${currentOrg.slug}/customs/${d.id}`}
                          className="font-mono text-blue-600 hover:underline text-xs"
                        >
                          {d.reference_number}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-slate-700">{typeLabels[d.declaration_type] ?? d.declaration_type}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge className={statusColors[d.status] ?? "bg-slate-100 text-slate-800"}>
                          {d.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-600">{d.hs_code ?? "—"}</td>
                      <td className="py-3 pr-4 text-slate-700">
                        {d.declared_value_eur != null
                          ? `€${Number(d.declared_value_eur).toLocaleString("de-DE", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{d.destination_country ?? "—"}</td>
                      <td className="py-3 text-slate-500">
                        {new Date(d.created_at).toLocaleDateString("de-DE")}
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
