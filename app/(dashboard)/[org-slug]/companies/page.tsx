"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import {
  getCompanies,
  type Company,
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
import { Input } from "@/components/ui/input";
import { Loader2, ChevronLeft, ChevronRight, Building2, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CompaniesPage() {
  const { currentOrg } = useOrg();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 15;

  async function loadCompanies() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const result = await getCompanies(currentOrg.id, {
        search: searchQuery || undefined,
        page,
        pageSize,
      });
      setCompanies(result.companies);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load companies");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, [currentOrg, searchQuery, page]);

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Company Directory</h2>
          <p className="text-slate-600">Manage buyers and suppliers</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or VAT ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Companies ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No companies found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Legal Form</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>VAT ID</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link
                          href={`/${currentOrg.slug}/companies/${c.id}`}
                          className="font-medium hover:underline"
                        >
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell>{c.legal_form}</TableCell>
                      <TableCell>{c.city}, {c.state}</TableCell>
                      <TableCell className="font-mono text-sm">{c.vat_id || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {c.is_buyer && (
                            <Badge variant="outline" className="bg-blue-50">Buyer</Badge>
                          )}
                          {c.is_supplier && (
                            <Badge variant="outline" className="bg-green-50">Supplier</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-500">
                    Page {page} of {totalPages} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
