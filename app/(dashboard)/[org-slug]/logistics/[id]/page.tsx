"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import {
  getShipment,
  getShipmentInvoices,
  getInvoiceSignedUrl,
  updateShipmentStatus,
  type Shipment,
  type ShipmentInvoice,
  type ShipmentStatus,
} from "@/lib/actions/shipments";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  booked: "bg-blue-100 text-blue-800",
  in_transit: "bg-yellow-100 text-yellow-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function ShipmentDetailPage() {
  const { currentOrg } = useOrg();
  const params = useParams();
  const id = params.id as string;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [invoices, setInvoices] = useState<ShipmentInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<ShipmentStatus | "">("");

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [s, inv] = await Promise.all([getShipment(id), getShipmentInvoices(id)]);
        setShipment(s);
        setInvoices(inv);
        setNewStatus(s.status);
      } catch {
        toast.error("Failed to load shipment");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleStatusUpdate() {
    if (!shipment || !newStatus || newStatus === shipment.status) return;
    setIsUpdating(true);
    try {
      const updated = await updateShipmentStatus(id, newStatus as ShipmentStatus);
      setShipment(updated);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDownloadInvoice(invoiceId: string) {
    try {
      const url = await getInvoiceSignedUrl(invoiceId);
      window.open(url, "_blank");
    } catch {
      toast.error("Failed to get download link");
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

  if (!shipment) {
    return <div className="text-slate-600">Shipment not found.</div>;
  }

  const origin = shipment.origin as { name?: string; street?: string; city?: string; zip?: string; country?: string };
  const destination = shipment.destination as { name?: string; street?: string; city?: string; zip?: string; country?: string };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/logistics`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-mono">{shipment.tracking_number}</h2>
          <p className="text-slate-600 capitalize">{shipment.carrier.toUpperCase()} · {shipment.service_type}</p>
        </div>
      </div>

      {/* Status + Update */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Badge className={statusColors[shipment.status] || ""}>
            {shipment.status.replace("_", " ")}
          </Badge>
          <div className="flex items-center gap-2 ml-4">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ShipmentStatus)}>
              <SelectTrigger className="w-40" id="update-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating || newStatus === shipment.status}
              size="sm"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Origin</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1 text-slate-700">
            <p className="font-medium">{origin.name}</p>
            <p>{origin.street}</p>
            <p>{origin.zip} {origin.city}</p>
            <p>{origin.country}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Destination</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1 text-slate-700">
            <p className="font-medium">{destination.name}</p>
            <p>{destination.street}</p>
            <p>{destination.zip} {destination.city}</p>
            <p>{destination.country}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Shipment Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Weight</dt>
              <dd className="font-medium">{shipment.weight_kg ? `${shipment.weight_kg} kg` : "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Pickup Date</dt>
              <dd className="font-medium">{shipment.pickup_date ? new Date(shipment.pickup_date).toLocaleDateString() : "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Estimated Delivery</dt>
              <dd className="font-medium">{shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString() : "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Actual Delivery</dt>
              <dd className="font-medium">{shipment.actual_delivery ? new Date(shipment.actual_delivery).toLocaleDateString() : "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">Notes</dt>
              <dd className="font-medium">{shipment.notes || "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader><CardTitle>Invoices ({invoices.length})</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-slate-500 text-sm">No invoices for this shipment.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.amount.toFixed(2)} {inv.currency}</TableCell>
                    <TableCell>{new Date(inv.issued_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {inv.storage_path && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(inv.id)}
                        >
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
