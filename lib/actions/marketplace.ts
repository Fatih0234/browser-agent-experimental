"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Marketplace = "amazon" | "ebay" | "otto";
export type ListingStatus = "active" | "inactive" | "suspended";
export type OrderStatus = "pending" | "shipped" | "delivered" | "returned" | "refunded";
export type ReportType = "orders" | "payments" | "performance";

export interface MarketplaceListing {
  id: string;
  org_id: string;
  marketplace: Marketplace;
  external_id: string;
  title: string;
  status: ListingStatus;
  price: number;
  stock_qty: number;
  seed_run_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceOrder {
  id: string;
  org_id: string;
  marketplace: Marketplace;
  order_number: string;
  listing_id: string | null;
  quantity: number;
  total_amount: number;
  currency: string;
  status: OrderStatus;
  customer_name: string;
  ordered_at: string;
  seed_run_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceReport {
  id: string;
  org_id: string;
  marketplace: Marketplace;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  storage_path: string | null;
  generated_at: string;
  seed_run_id: string | null;
  created_at: string;
}

async function verifyMembership(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string, userId: string) {
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .single();
  if (!membership) throw new Error("Not a member of this organization");
  return membership;
}

// ============================================
// LISTINGS
// ============================================

export async function getListings(
  orgId: string,
  filters?: { marketplace?: Marketplace; status?: ListingStatus }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  let query = supabase
    .from("marketplace_listings")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (filters?.marketplace) query = query.eq("marketplace", filters.marketplace);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return data as MarketplaceListing[];
}

export async function getListing(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.from("marketplace_listings").select("*").eq("id", id).single();
  if (error) throw error;
  if (!data) throw new Error("Listing not found");
  await verifyMembership(supabase, data.org_id, user.id);
  return data as MarketplaceListing;
}

export async function updateListing(
  id: string,
  updates: { price?: number; stock_qty?: number; status?: ListingStatus; title?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase.from("marketplace_listings").select("org_id").eq("id", id).single();
  if (!current) throw new Error("Listing not found");
  await verifyMembership(supabase, current.org_id, user.id);

  const { data, error } = await supabase
    .from("marketplace_listings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "listing_update",
    entity_type: "marketplace_listing",
    entity_id: id,
    metadata: updates,
  });

  revalidatePath("/dashboard");
  return data as MarketplaceListing;
}

// ============================================
// ORDERS
// ============================================

export async function getOrders(
  orgId: string,
  filters?: {
    marketplace?: Marketplace;
    status?: OrderStatus;
    from_date?: string;
    to_date?: string;
    page?: number;
    pageSize?: number;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("marketplace_orders")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("ordered_at", { ascending: false })
    .range(from, to);

  if (filters?.marketplace) query = query.eq("marketplace", filters.marketplace);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.from_date) query = query.gte("ordered_at", filters.from_date);
  if (filters?.to_date) query = query.lte("ordered_at", filters.to_date);

  const { data, error, count } = await query;
  if (error) throw error;
  return { orders: data as MarketplaceOrder[], total: count ?? 0, page, pageSize };
}

export async function getOrder(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.from("marketplace_orders").select("*").eq("id", id).single();
  if (error) throw error;
  if (!data) throw new Error("Order not found");
  await verifyMembership(supabase, data.org_id, user.id);
  return data as MarketplaceOrder;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("marketplace_orders")
    .select("org_id, status, order_number, marketplace")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Order not found");
  await verifyMembership(supabase, current.org_id, user.id);

  const { data, error } = await supabase
    .from("marketplace_orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "order_status_change",
    entity_type: "marketplace_order",
    entity_id: id,
    metadata: {
      order_number: current.order_number,
      marketplace: current.marketplace,
      previous_status: current.status,
      new_status: status,
    },
  });

  revalidatePath("/dashboard");
  return data as MarketplaceOrder;
}

// ============================================
// REPORTS
// ============================================

export async function getReports(orgId: string, filters?: { marketplace?: Marketplace }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  let query = supabase
    .from("marketplace_reports")
    .select("*")
    .eq("org_id", orgId)
    .order("generated_at", { ascending: false });

  if (filters?.marketplace) query = query.eq("marketplace", filters.marketplace);

  const { data, error } = await query;
  if (error) throw error;
  return data as MarketplaceReport[];
}

export async function generateOrdersReportCsv(orgId: string, marketplace: Marketplace): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const { data: orders, error } = await supabase
    .from("marketplace_orders")
    .select("order_number, customer_name, quantity, total_amount, currency, status, ordered_at")
    .eq("org_id", orgId)
    .eq("marketplace", marketplace)
    .order("ordered_at", { ascending: false });

  if (error) throw error;

  const header = "order_number,customer_name,quantity,total_amount,currency,status,ordered_at";
  const rows = (orders ?? []).map((o) =>
    [
      o.order_number,
      `"${o.customer_name}"`,
      o.quantity,
      o.total_amount,
      o.currency,
      o.status,
      o.ordered_at,
    ].join(",")
  );

  return [header, ...rows].join("\n");
}

export async function getReportDownloadUrl(reportId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: report } = await supabase
    .from("marketplace_reports")
    .select("org_id, storage_path")
    .eq("id", reportId)
    .single();
  if (!report) throw new Error("Report not found");
  await verifyMembership(supabase, report.org_id, user.id);
  if (!report.storage_path) throw new Error("No file attached to this report");

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(report.storage_path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
