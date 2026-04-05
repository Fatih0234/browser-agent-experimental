"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import { getOrders, getListings, type Marketplace } from "@/lib/actions/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingBag, Package, TrendingUp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const marketplaceColors: Record<string, string> = {
  amazon: "bg-orange-100 text-orange-800",
  ebay: "bg-blue-100 text-blue-800",
  otto: "bg-red-100 text-red-800",
};

const MARKETPLACES: Marketplace[] = ["amazon", "ebay", "otto"];

interface MarketplaceSummary {
  marketplace: Marketplace;
  totalOrders: number;
  pendingOrders: number;
  activeListings: number;
}

export default function MarketplaceDashboardPage() {
  const { currentOrg } = useOrg();
  const [summaries, setSummaries] = useState<MarketplaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentOrg) return;
      setIsLoading(true);
      try {
        const results = await Promise.all(
          MARKETPLACES.map(async (mp) => {
            const [ordersResult, listings] = await Promise.all([
              getOrders(currentOrg.id, { marketplace: mp, pageSize: 1000 }),
              getListings(currentOrg.id, { marketplace: mp }),
            ]);
            return {
              marketplace: mp,
              totalOrders: ordersResult.total,
              pendingOrders: ordersResult.orders.filter((o) => o.status === "pending").length,
              activeListings: listings.filter((l) => l.status === "active").length,
            };
          })
        );
        setSummaries(results.filter((s) => s.totalOrders > 0 || s.activeListings > 0));
      } catch {
        toast.error("Failed to load marketplace data");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentOrg]);

  if (!currentOrg) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Marketplace</h2>
        <p className="text-slate-600">Multi-channel sales back-office for {currentOrg.name}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : summaries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No marketplace data yet. Seed the scenario to generate sample data.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaries.map((s) => (
            <Card key={s.marketplace}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize text-lg">{s.marketplace}</CardTitle>
                  <Badge className={marketplaceColors[s.marketplace] || ""}>
                    {s.marketplace.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <ShoppingBag className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">Total Orders:</span>
                  <span className="font-semibold">{s.totalOrders}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-orange-400" />
                  <span className="text-slate-600">Pending:</span>
                  <span className="font-semibold text-orange-600">{s.pendingOrders}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">Active Listings:</span>
                  <span className="font-semibold">{s.activeListings}</span>
                </div>
                <div className="pt-2 flex gap-3 text-sm">
                  <Link
                    href={`/${currentOrg.slug}/marketplace/orders?marketplace=${s.marketplace}`}
                    className="text-blue-600 hover:underline"
                  >
                    View orders →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="flex gap-4 text-sm">
        <Link href={`/${currentOrg.slug}/marketplace/orders`} className="text-blue-600 hover:underline">
          All orders →
        </Link>
        <Link href={`/${currentOrg.slug}/marketplace/listings`} className="text-blue-600 hover:underline">
          Listings →
        </Link>
        <Link href={`/${currentOrg.slug}/marketplace/reports`} className="text-blue-600 hover:underline">
          Reports →
        </Link>
      </div>
    </div>
  );
}
