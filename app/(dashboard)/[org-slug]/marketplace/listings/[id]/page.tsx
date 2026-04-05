"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import { getListing, updateListing, type MarketplaceListing, type ListingStatus } from "@/lib/actions/marketplace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  active: "bg-green-100 text-green-800",
  inactive: "bg-slate-100 text-slate-800",
  suspended: "bg-red-100 text-red-800",
};

const marketplaceColors: Record<string, string> = {
  amazon: "bg-orange-100 text-orange-800",
  ebay: "bg-blue-100 text-blue-800",
  otto: "bg-red-100 text-red-800",
};

export default function ListingDetailPage() {
  const { currentOrg } = useOrg();
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState<ListingStatus>("active");

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const l = await getListing(id);
        setListing(l);
        setPrice(String(l.price));
        setStock(String(l.stock_qty));
        setStatus(l.status);
      } catch {
        toast.error("Failed to load listing");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave() {
    if (!listing) return;
    setIsSaving(true);
    try {
      const updated = await updateListing(id, {
        price: parseFloat(price),
        stock_qty: parseInt(stock, 10),
        status,
      });
      setListing(updated);
      toast.success("Listing updated");
    } catch {
      toast.error("Failed to update listing");
    } finally {
      setIsSaving(false);
    }
  }

  if (!currentOrg) return null;
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  if (!listing) return <div className="text-slate-600">Listing not found.</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/marketplace/listings`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{listing.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={marketplaceColors[listing.marketplace] || ""}>{listing.marketplace.toUpperCase()}</Badge>
            <Badge className={statusColors[listing.status] || ""}>{listing.status}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Listing Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-slate-500">External ID</p>
            <p className="font-mono text-sm">{listing.external_id}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Qty</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listing-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ListingStatus)}>
                <SelectTrigger id="listing-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Info</CardTitle></CardHeader>
        <CardContent>
          <dl className="text-sm space-y-2">
            <div><dt className="text-slate-500">Created</dt><dd>{new Date(listing.created_at).toLocaleString()}</dd></div>
            <div><dt className="text-slate-500">Last Updated</dt><dd>{new Date(listing.updated_at).toLocaleString()}</dd></div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
