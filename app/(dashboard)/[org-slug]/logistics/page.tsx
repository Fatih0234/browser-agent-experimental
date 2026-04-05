"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import {
  getShipments,
  updateShipmentStatus,
  type Shipment,
  type ShipmentStatus,
  type ShipmentCarrier,
} from "@/lib/actions/shipments";
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
import { Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  booked: "bg-blue-100 text-blue-800",
  in_transit: "bg-yellow-100 text-yellow-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const carrierColors: Record<string, string> = {
  dhl: "bg-yellow-100 text-yellow-800",
  ups: "bg-amber-100 text-amber-800",
  fedex: "bg-purple-100 text-purple-800",
  dpd: "bg-red-100 text-red-800",
};

export default function LogisticsPage() {
  const { currentOrg } = useOrg();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "all">("all");
  const [carrierFilter, setCarrierFilter] = useState<ShipmentCarrier | "all">("all");
  const pageSize = 15;

  async function loadShipments() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const result = await getShipments(currentOrg.id, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        carrier: carrierFilter !== "all" ? carrierFilter : undefined,
        page,
        pageSize,
      });
      setShipments(result.shipments);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load shipments");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadShipments();
  }, [currentOrg, statusFilter, carrierFilter, page]);

  if (!currentOrg) return <div className="text-slate-600">No organization selected</div>;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Logistics</h2>
          <p className="text-slate-600">Manage shipments and carrier invoices</p>
        </div>
        <Link href={`/${currentOrg.slug}/logistics/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Shipment
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v as ShipmentStatus | "all"); setPage(1); }}
        >
          <SelectTrigger className="w-44" id="status-filter">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={carrierFilter}
          onValueChange={(v) => { setCarrierFilter(v as ShipmentCarrier | "all"); setPage(1); }}
        >
          <SelectTrigger className="w-36" id="carrier-filter">
            <SelectValue placeholder="All carriers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All carriers</SelectItem>
            <SelectItem value="dhl">DHL</SelectItem>
            <SelectItem value="ups">UPS</SelectItem>
            <SelectItem value="fedex">FedEx</SelectItem>
            <SelectItem value="dpd">DPD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shipments ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No shipments found. Create your first shipment to get started.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link
                          href={`/${currentOrg.slug}/logistics/${s.id}`}
                          className="font-mono text-sm font-medium hover:underline"
                        >
                          {s.tracking_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={carrierColors[s.carrier] || ""}>
                          {s.carrier.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[s.status] || ""}>
                          {s.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{s.service_type}</TableCell>
                      <TableCell>
                        {(s.destination as { city?: string; country?: string }).city},{" "}
                        {(s.destination as { city?: string; country?: string }).country}
                      </TableCell>
                      <TableCell>
                        {s.estimated_delivery
                          ? new Date(s.estimated_delivery).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
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

      <div className="mt-2">
        <Link href={`/${currentOrg.slug}/logistics/invoices`} className="text-sm text-blue-600 hover:underline">
          View all invoices →
        </Link>
      </div>
    </div>
  );
}
