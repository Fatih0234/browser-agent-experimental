"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import {
  getOrders,
  updateOrderStatus,
  type MarketplaceOrder,
  type Marketplace,
  type OrderStatus,
} from "@/lib/actions/marketplace";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  returned: "bg-orange-100 text-orange-800",
  refunded: "bg-red-100 text-red-800",
};

const marketplaceColors: Record<string, string> = {
  amazon: "bg-orange-100 text-orange-800",
  ebay: "bg-blue-100 text-blue-800",
  otto: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const { currentOrg } = useOrg();
  const searchParams = useSearchParams();
  const defaultMarketplace = (searchParams.get("marketplace") as Marketplace | null) ?? "all";

  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [marketplaceFilter, setMarketplaceFilter] = useState<Marketplace | "all">(defaultMarketplace as Marketplace | "all");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const pageSize = 15;

  async function loadOrders() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const result = await getOrders(currentOrg.id, {
        marketplace: marketplaceFilter !== "all" ? marketplaceFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        page,
        pageSize,
      });
      setOrders(result.orders);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [currentOrg, marketplaceFilter, statusFilter, fromDate, toDate, page]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      toast.success("Order status updated");
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  }

  if (!currentOrg) return null;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/marketplace`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Orders</h2>
          <p className="text-slate-600">Manage orders across all channels</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Marketplace</Label>
          <Select value={marketplaceFilter} onValueChange={(v) => { setMarketplaceFilter(v as Marketplace | "all"); setPage(1); }}>
            <SelectTrigger className="w-36" id="marketplace-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              <SelectItem value="amazon">Amazon</SelectItem>
              <SelectItem value="ebay">eBay</SelectItem>
              <SelectItem value="otto">OTTO</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Status</Label>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as OrderStatus | "all"); setPage(1); }}>
            <SelectTrigger className="w-36" id="order-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-slate-500 mb-1 block">From Date</Label>
          <Input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="w-40"
          />
        </div>

        <div>
          <Label className="text-xs text-slate-500 mb-1 block">To Date</Label>
          <Input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="w-40"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No orders found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ordered</TableHead>
                    <TableHead>Update Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link href={`/${currentOrg.slug}/marketplace/orders/${o.id}`} className="font-mono text-sm hover:underline">
                          {o.order_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={marketplaceColors[o.marketplace] || ""}>
                          {o.marketplace.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{o.customer_name}</TableCell>
                      <TableCell>{o.quantity}</TableCell>
                      <TableCell>{o.total_amount.toFixed(2)} {o.currency}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[o.status] || ""}>{o.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(o.ordered_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Select
                          value={o.status}
                          onValueChange={(v) => handleStatusChange(o.id, v as OrderStatus)}
                          disabled={updatingId === o.id}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="returned">Returned</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-500">Page {page} of {totalPages} ({total} total)</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      Next <ChevronRight className="h-4 w-4" />
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
