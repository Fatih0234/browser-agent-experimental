"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import { getListings, updateListing, type MarketplaceListing, type Marketplace, type ListingStatus } from "@/lib/actions/marketplace";
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
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-slate-100 text-slate-800",
  suspended: "bg-red-100 text-red-800",
};

const marketplaceColors: Record<string, string> = {
  amazon: "bg-orange-100 text-orange-800",
  ebay: "bg-blue-100 text-blue-800",
  otto: "bg-red-100 text-red-800",
};

const LOW_STOCK_THRESHOLD = 5;

export default function ListingsPage() {
  const { currentOrg } = useOrg();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marketplaceFilter, setMarketplaceFilter] = useState<Marketplace | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadListings() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const data = await getListings(currentOrg.id, {
        marketplace: marketplaceFilter !== "all" ? marketplaceFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setListings(data);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadListings(); }, [currentOrg, marketplaceFilter, statusFilter]);

  function startEdit(listing: MarketplaceListing) {
    setEditingId(listing.id);
    setEditPrice(String(listing.price));
    setEditStock(String(listing.stock_qty));
  }

  async function saveEdit(id: string) {
    setIsSaving(true);
    try {
      const updated = await updateListing(id, {
        price: parseFloat(editPrice),
        stock_qty: parseInt(editStock, 10),
      });
      setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
      setEditingId(null);
      toast.success("Listing updated");
    } catch {
      toast.error("Failed to update listing");
    } finally {
      setIsSaving(false);
    }
  }

  if (!currentOrg) return null;

  const lowStockCount = listings.filter((l) => l.stock_qty < LOW_STOCK_THRESHOLD && l.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/marketplace`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Listings</h2>
          <p className="text-slate-600">Manage your product listings across channels</p>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <span>{lowStockCount} active listing{lowStockCount > 1 ? "s" : ""} with low stock (below {LOW_STOCK_THRESHOLD})</span>
        </div>
      )}

      <div className="flex gap-3">
        <Select value={marketplaceFilter} onValueChange={(v) => setMarketplaceFilter(v as Marketplace | "all")}>
          <SelectTrigger className="w-36" id="listings-marketplace-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="amazon">Amazon</SelectItem>
            <SelectItem value="ebay">eBay</SelectItem>
            <SelectItem value="otto">OTTO</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ListingStatus | "all")}>
          <SelectTrigger className="w-36" id="listings-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle>Listings ({listings.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
          ) : listings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No listings found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>External ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price (€)</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Link href={`/${currentOrg.slug}/marketplace/listings/${l.id}`} className="hover:underline font-medium">
                        {l.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={marketplaceColors[l.marketplace] || ""}>{l.marketplace.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{l.external_id}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[l.status] || ""}>{l.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {editingId === l.id ? (
                        <Input
                          id={`price-${l.id}`}
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-24 h-7 text-sm"
                        />
                      ) : (
                        <span className={l.stock_qty < LOW_STOCK_THRESHOLD && l.status === "active" ? "text-yellow-600 font-medium" : ""}>
                          {l.price.toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === l.id ? (
                        <Input
                          id={`stock-${l.id}`}
                          type="number"
                          min="0"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="w-20 h-7 text-sm"
                        />
                      ) : (
                        <span className={l.stock_qty < LOW_STOCK_THRESHOLD && l.status === "active" ? "text-yellow-600 font-medium" : ""}>
                          {l.stock_qty} {l.stock_qty < LOW_STOCK_THRESHOLD && l.status === "active" ? "⚠" : ""}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === l.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => saveEdit(l.id)} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => startEdit(l)}>Edit</Button>
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
