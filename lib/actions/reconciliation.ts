"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ReconciliationStatus = "pending" | "matched" | "flagged" | "dismissed";
export type InvoiceSource = "shipment" | "marketplace";
export type MatchType = "exact" | "partial" | "estimated";

export interface ReconciliationMatch {
  id: string;
  org_id: string;
  invoice_source: InvoiceSource;
  invoice_id: string;
  invoice_amount: number;
  expected_amount: number | null;
  amount_delta: number | null;
  currency: string;
  status: ReconciliationStatus;
  match_type: MatchType | null;
  flagged_reason: string | null;
  notes: string | null;
  matched_by: string | null;
  matched_at: string | null;
  seed_run_id: string | null;
  created_at: string;
  updated_at: string;
}

// Unified invoice view — combines shipment invoices and marketplace orders
export interface UnifiedInvoice {
  id: string;
  invoice_source: InvoiceSource;
  invoice_id: string;
  reference: string; // invoice_number or order_number
  portal_label: string; // e.g. "DHL", "Amazon"
  amount: number;
  currency: string;
  issued_at: string;
  reconciliation_id: string | null;
  reconciliation_status: ReconciliationStatus;
  amount_delta: number | null;
  flagged_reason: string | null;
}

export interface ReconciliationSummary {
  total: number;
  pending: number;
  matched: number;
  flagged: number;
  dismissed: number;
  total_invoice_amount: number;
  total_discrepancy: number;
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

export async function getReconciliationSummary(orgId: string): Promise<ReconciliationSummary> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  // Count shipment invoices
  const { count: shipmentTotal } = await supabase
    .from("shipment_invoices")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);

  // Count marketplace orders
  const { count: marketplaceTotal } = await supabase
    .from("marketplace_orders")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);

  const total = (shipmentTotal ?? 0) + (marketplaceTotal ?? 0);

  // Get all reconciliation matches for summary
  const { data: matches } = await supabase
    .from("reconciliation_matches")
    .select("status, invoice_amount, amount_delta")
    .eq("org_id", orgId);

  const matched = matches?.filter((m) => m.status === "matched").length ?? 0;
  const flagged = matches?.filter((m) => m.status === "flagged").length ?? 0;
  const dismissed = matches?.filter((m) => m.status === "dismissed").length ?? 0;
  const pending = total - matched - flagged - dismissed;

  const total_invoice_amount = matches?.reduce((sum, m) => sum + (m.invoice_amount ?? 0), 0) ?? 0;
  const total_discrepancy = matches
    ?.filter((m) => m.amount_delta !== null && m.amount_delta !== 0)
    .reduce((sum, m) => sum + Math.abs(m.amount_delta ?? 0), 0) ?? 0;

  return { total, pending: Math.max(0, pending), matched, flagged, dismissed, total_invoice_amount, total_discrepancy };
}

export async function getUnifiedInvoices(
  orgId: string,
  filters?: { status?: ReconciliationStatus | "all"; source?: InvoiceSource | "all"; page?: number; pageSize?: number }
): Promise<{ invoices: UnifiedInvoice[]; total: number; page: number; pageSize: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;

  // Load all reconciliation matches for this org
  const { data: matches } = await supabase
    .from("reconciliation_matches")
    .select("*")
    .eq("org_id", orgId);

  const matchByInvoiceId = new Map<string, ReconciliationMatch>();
  for (const m of matches ?? []) {
    matchByInvoiceId.set(m.invoice_id, m as ReconciliationMatch);
  }

  const invoices: UnifiedInvoice[] = [];

  // Load shipment invoices with carrier info
  if (!filters?.source || filters.source === "all" || filters.source === "shipment") {
    const { data: shipmentInvoices } = await supabase
      .from("shipment_invoices")
      .select("id, invoice_number, amount, currency, issued_date, shipments(carrier)")
      .eq("org_id", orgId)
      .order("issued_date", { ascending: false });

    for (const inv of shipmentInvoices ?? []) {
      const match = matchByInvoiceId.get(inv.id);
      const status = match?.status ?? "pending";
      if (filters?.status && filters.status !== "all" && status !== filters.status) continue;
      const carrier = (inv.shipments as { carrier?: string } | null)?.carrier?.toUpperCase() ?? "Carrier";
      invoices.push({
        id: inv.id,
        invoice_source: "shipment",
        invoice_id: inv.id,
        reference: inv.invoice_number,
        portal_label: carrier,
        amount: inv.amount,
        currency: inv.currency,
        issued_at: inv.issued_date,
        reconciliation_id: match?.id ?? null,
        reconciliation_status: status,
        amount_delta: match?.amount_delta ?? null,
        flagged_reason: match?.flagged_reason ?? null,
      });
    }
  }

  // Load marketplace orders as revenue invoices
  if (!filters?.source || filters.source === "all" || filters.source === "marketplace") {
    const { data: orders } = await supabase
      .from("marketplace_orders")
      .select("id, order_number, total_amount, currency, ordered_at, marketplace")
      .eq("org_id", orgId)
      .order("ordered_at", { ascending: false });

    for (const order of orders ?? []) {
      const match = matchByInvoiceId.get(order.id);
      const status = match?.status ?? "pending";
      if (filters?.status && filters.status !== "all" && status !== filters.status) continue;
      const portal = order.marketplace.charAt(0).toUpperCase() + order.marketplace.slice(1);
      invoices.push({
        id: order.id,
        invoice_source: "marketplace",
        invoice_id: order.id,
        reference: order.order_number,
        portal_label: portal,
        amount: order.total_amount,
        currency: order.currency,
        issued_at: order.ordered_at,
        reconciliation_id: match?.id ?? null,
        reconciliation_status: status,
        amount_delta: match?.amount_delta ?? null,
        flagged_reason: match?.flagged_reason ?? null,
      });
    }
  }

  // Sort by date descending
  invoices.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());

  const total = invoices.length;
  const from = (page - 1) * pageSize;
  const paginated = invoices.slice(from, from + pageSize);

  return { invoices: paginated, total, page, pageSize };
}

export async function getUnifiedInvoice(invoiceId: string, source: InvoiceSource) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  let unified: Omit<UnifiedInvoice, "reconciliation_id" | "reconciliation_status" | "amount_delta" | "flagged_reason">;

  if (source === "shipment") {
    const { data, error } = await supabase
      .from("shipment_invoices")
      .select("*, shipments(carrier, tracking_number, status, destination)")
      .eq("id", invoiceId)
      .single();
    if (error || !data) throw new Error("Invoice not found");
    await verifyMembership(supabase, data.org_id, user.id);
    const carrier = (data.shipments as { carrier?: string } | null)?.carrier?.toUpperCase() ?? "Carrier";
    unified = {
      id: data.id,
      invoice_source: "shipment",
      invoice_id: data.id,
      reference: data.invoice_number,
      portal_label: carrier,
      amount: data.amount,
      currency: data.currency,
      issued_at: data.issued_date,
    };
    const match = await getReconciliationMatchByInvoiceId(supabase, invoiceId);
    return { ...unified, ...matchFields(match), sourceData: data };
  } else {
    const { data, error } = await supabase
      .from("marketplace_orders")
      .select("*")
      .eq("id", invoiceId)
      .single();
    if (error || !data) throw new Error("Order not found");
    await verifyMembership(supabase, data.org_id, user.id);
    const portal = data.marketplace.charAt(0).toUpperCase() + data.marketplace.slice(1);
    unified = {
      id: data.id,
      invoice_source: "marketplace",
      invoice_id: data.id,
      reference: data.order_number,
      portal_label: portal,
      amount: data.total_amount,
      currency: data.currency,
      issued_at: data.ordered_at,
    };
    const match = await getReconciliationMatchByInvoiceId(supabase, invoiceId);
    return { ...unified, ...matchFields(match), sourceData: data };
  }
}

async function getReconciliationMatchByInvoiceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string
): Promise<ReconciliationMatch | null> {
  const { data } = await supabase
    .from("reconciliation_matches")
    .select("*")
    .eq("invoice_id", invoiceId)
    .maybeSingle();
  return (data as ReconciliationMatch | null) ?? null;
}

function matchFields(match: ReconciliationMatch | null) {
  return {
    reconciliation_id: match?.id ?? null,
    reconciliation_status: match?.status ?? "pending" as ReconciliationStatus,
    amount_delta: match?.amount_delta ?? null,
    flagged_reason: match?.flagged_reason ?? null,
    match: match,
  };
}

export async function matchInvoice(
  orgId: string,
  invoiceId: string,
  source: InvoiceSource,
  params: { expected_amount: number; match_type: MatchType; notes?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  // Get invoice amount
  const invoiceAmount = await getInvoiceAmount(supabase, invoiceId, source);

  const existing = await getReconciliationMatchByInvoiceId(supabase, invoiceId);

  if (existing) {
    const { data, error } = await supabase
      .from("reconciliation_matches")
      .update({
        status: "matched",
        match_type: params.match_type,
        expected_amount: params.expected_amount,
        notes: params.notes ?? null,
        matched_by: user.id,
        matched_at: new Date().toISOString(),
        flagged_reason: null,
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;

    await logAudit(supabase, orgId, user.id, "reconciliation_match", existing.id, {
      invoice_id: invoiceId, source, status: "matched", match_type: params.match_type
    });
    revalidatePath("/dashboard");
    return data as ReconciliationMatch;
  } else {
    const { data, error } = await supabase
      .from("reconciliation_matches")
      .insert({
        org_id: orgId,
        invoice_source: source,
        invoice_id: invoiceId,
        invoice_amount: invoiceAmount,
        expected_amount: params.expected_amount,
        currency: "EUR",
        status: "matched",
        match_type: params.match_type,
        notes: params.notes ?? null,
        matched_by: user.id,
        matched_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    await logAudit(supabase, orgId, user.id, "reconciliation_match", data.id, {
      invoice_id: invoiceId, source, status: "matched", match_type: params.match_type
    });
    revalidatePath("/dashboard");
    return data as ReconciliationMatch;
  }
}

export async function flagInvoice(
  orgId: string,
  invoiceId: string,
  source: InvoiceSource,
  params: { flagged_reason: string; expected_amount?: number; notes?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const invoiceAmount = await getInvoiceAmount(supabase, invoiceId, source);
  const existing = await getReconciliationMatchByInvoiceId(supabase, invoiceId);

  if (existing) {
    const { data, error } = await supabase
      .from("reconciliation_matches")
      .update({
        status: "flagged",
        flagged_reason: params.flagged_reason,
        expected_amount: params.expected_amount ?? existing.expected_amount,
        notes: params.notes ?? existing.notes,
        matched_by: user.id,
        matched_at: new Date().toISOString(),
        match_type: null,
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;

    await logAudit(supabase, orgId, user.id, "reconciliation_flag", existing.id, {
      invoice_id: invoiceId, source, reason: params.flagged_reason
    });
    revalidatePath("/dashboard");
    return data as ReconciliationMatch;
  } else {
    const { data, error } = await supabase
      .from("reconciliation_matches")
      .insert({
        org_id: orgId,
        invoice_source: source,
        invoice_id: invoiceId,
        invoice_amount: invoiceAmount,
        expected_amount: params.expected_amount ?? null,
        currency: "EUR",
        status: "flagged",
        flagged_reason: params.flagged_reason,
        notes: params.notes ?? null,
        matched_by: user.id,
        matched_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    await logAudit(supabase, orgId, user.id, "reconciliation_flag", data.id, {
      invoice_id: invoiceId, source, reason: params.flagged_reason
    });
    revalidatePath("/dashboard");
    return data as ReconciliationMatch;
  }
}

export async function getMismatches(
  orgId: string,
  filters?: { page?: number; pageSize?: number }
): Promise<{ matches: ReconciliationMatch[]; total: number; page: number; pageSize: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("reconciliation_matches")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .eq("status", "flagged")
    .order("matched_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { matches: (data ?? []) as ReconciliationMatch[], total: count ?? 0, page, pageSize };
}

export async function getReconciliationReport(orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  // Carrier breakdown
  const { data: shipmentInvoices } = await supabase
    .from("shipment_invoices")
    .select("id, amount, currency, shipments(carrier)")
    .eq("org_id", orgId);

  const { data: orders } = await supabase
    .from("marketplace_orders")
    .select("id, total_amount, currency, marketplace")
    .eq("org_id", orgId);

  const { data: matches } = await supabase
    .from("reconciliation_matches")
    .select("*")
    .eq("org_id", orgId);

  const matchByInvoiceId = new Map<string, ReconciliationMatch>();
  for (const m of matches ?? []) matchByInvoiceId.set(m.invoice_id, m as ReconciliationMatch);

  // Carrier breakdown
  const carrierBreakdown: Record<string, { total: number; matched: number; flagged: number; pending: number; amount: number }> = {};
  for (const inv of shipmentInvoices ?? []) {
    const carrier = (inv.shipments as { carrier?: string } | null)?.carrier?.toUpperCase() ?? "UNKNOWN";
    if (!carrierBreakdown[carrier]) carrierBreakdown[carrier] = { total: 0, matched: 0, flagged: 0, pending: 0, amount: 0 };
    const match = matchByInvoiceId.get(inv.id);
    carrierBreakdown[carrier].total++;
    carrierBreakdown[carrier].amount += inv.amount;
    if (match?.status === "matched") carrierBreakdown[carrier].matched++;
    else if (match?.status === "flagged") carrierBreakdown[carrier].flagged++;
    else carrierBreakdown[carrier].pending++;
  }

  // Marketplace breakdown
  const marketplaceBreakdown: Record<string, { total: number; matched: number; flagged: number; pending: number; amount: number }> = {};
  for (const order of orders ?? []) {
    const mp = order.marketplace.charAt(0).toUpperCase() + order.marketplace.slice(1);
    if (!marketplaceBreakdown[mp]) marketplaceBreakdown[mp] = { total: 0, matched: 0, flagged: 0, pending: 0, amount: 0 };
    const match = matchByInvoiceId.get(order.id);
    marketplaceBreakdown[mp].total++;
    marketplaceBreakdown[mp].amount += order.total_amount;
    if (match?.status === "matched") marketplaceBreakdown[mp].matched++;
    else if (match?.status === "flagged") marketplaceBreakdown[mp].flagged++;
    else marketplaceBreakdown[mp].pending++;
  }

  const totalFlaggedAmount = (matches ?? [])
    .filter((m) => m.status === "flagged" && m.amount_delta !== null)
    .reduce((sum, m) => sum + Math.abs(m.amount_delta ?? 0), 0);

  return { carrierBreakdown, marketplaceBreakdown, totalFlaggedAmount };
}

export async function generateReconciliationCsv(orgId: string): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const { invoices } = await getUnifiedInvoices(orgId, { pageSize: 1000 });

  const header = "reference,source,portal,amount,currency,status,amount_delta,flagged_reason,issued_at";
  const rows = invoices.map((inv) =>
    [
      inv.reference,
      inv.invoice_source,
      inv.portal_label,
      inv.amount,
      inv.currency,
      inv.reconciliation_status,
      inv.amount_delta ?? "",
      inv.flagged_reason ? `"${inv.flagged_reason}"` : "",
      inv.issued_at,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

async function getInvoiceAmount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string,
  source: InvoiceSource
): Promise<number> {
  if (source === "shipment") {
    const { data } = await supabase.from("shipment_invoices").select("amount").eq("id", invoiceId).single();
    return data?.amount ?? 0;
  } else {
    const { data } = await supabase.from("marketplace_orders").select("total_amount").eq("id", invoiceId).single();
    return data?.total_amount ?? 0;
  }
}

async function logAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  userId: string,
  action: string,
  entityId: string,
  metadata: Record<string, unknown>
) {
  await supabase.from("audit_events").insert({
    org_id: orgId,
    user_id: userId,
    action,
    entity_type: "reconciliation_match",
    entity_id: entityId,
    metadata,
  });
}
