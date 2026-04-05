"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import { getOrder, updateOrderStatus, type MarketplaceOrder, type OrderStatus } from "@/lib/actions/marketplace";
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
import { ArrowLeft, Loader2 } from "lucide-react";
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

export default function OrderDetailPage() {
  const { currentOrg } = useOrg();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const o = await getOrder(id);
        setOrder(o);
        setNewStatus(o.status);
      } catch {
        toast.error("Failed to load order");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleUpdate() {
    if (!order || newStatus === order.status) return;
    setIsUpdating(true);
    try {
      const updated = await updateOrderStatus(id, newStatus);
      setOrder(updated);
      toast.success("Order status updated");
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  }

  if (!currentOrg) return null;

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  if (!order) return <div className="text-slate-600">Order not found.</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/marketplace/orders`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-mono">{order.order_number}</h2>
          <Badge className={marketplaceColors[order.marketplace] || ""}>{order.marketplace.toUpperCase()}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Status</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
          <div className="flex items-center gap-2 ml-4">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
              <SelectTrigger className="w-36" id="order-status">
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
            <Button onClick={handleUpdate} disabled={isUpdating || newStatus === order.status} size="sm">
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt className="text-slate-500">Customer</dt><dd className="font-medium">{order.customer_name}</dd></div>
            <div><dt className="text-slate-500">Channel</dt><dd className="font-medium capitalize">{order.marketplace}</dd></div>
            <div><dt className="text-slate-500">Quantity</dt><dd className="font-medium">{order.quantity}</dd></div>
            <div><dt className="text-slate-500">Total Amount</dt><dd className="font-medium">{order.total_amount.toFixed(2)} {order.currency}</dd></div>
            <div><dt className="text-slate-500">Ordered At</dt><dd className="font-medium">{new Date(order.ordered_at).toLocaleString()}</dd></div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
