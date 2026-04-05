"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ShipmentStatus = "draft" | "booked" | "in_transit" | "delivered" | "failed";
export type ShipmentCarrier = "dhl" | "ups" | "fedex" | "dpd";
export type ShipmentServiceType = "standard" | "express" | "overnight" | "economy";

export interface Address {
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
}

export interface Shipment {
  id: string;
  org_id: string;
  tracking_number: string;
  carrier: ShipmentCarrier;
  status: ShipmentStatus;
  origin: Address;
  destination: Address;
  weight_kg: number | null;
  service_type: ShipmentServiceType;
  pickup_date: string | null;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  notes: string | null;
  seed_run_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShipmentInvoice {
  id: string;
  org_id: string;
  shipment_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  issued_date: string;
  storage_path: string | null;
  seed_run_id: string | null;
  created_at: string;
}

function generateTrackingNumber(carrier: ShipmentCarrier): string {
  const prefix: Record<ShipmentCarrier, string> = {
    dhl: "JD",
    ups: "1Z",
    fedex: "FX",
    dpd: "DP",
  };
  const digits = Math.random().toString().slice(2, 14).padEnd(12, "0");
  return `${prefix[carrier]}${digits}`;
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

export async function getShipments(
  orgId: string,
  filters?: { status?: ShipmentStatus; carrier?: ShipmentCarrier; page?: number; pageSize?: number }
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
    .from("shipments")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.carrier) query = query.eq("carrier", filters.carrier);

  const { data, error, count } = await query;
  if (error) throw error;

  return { shipments: data as Shipment[], total: count ?? 0, page, pageSize };
}

export async function getShipment(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.from("shipments").select("*").eq("id", id).single();
  if (error) throw error;
  if (!data) throw new Error("Shipment not found");

  await verifyMembership(supabase, data.org_id, user.id);
  return data as Shipment;
}

export async function createShipment(
  orgId: string,
  shipmentData: {
    carrier: ShipmentCarrier;
    origin: Address;
    destination: Address;
    weight_kg?: number;
    service_type?: ShipmentServiceType;
    pickup_date?: string;
    estimated_delivery?: string;
    notes?: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const tracking_number = generateTrackingNumber(shipmentData.carrier);

  const { data, error } = await supabase
    .from("shipments")
    .insert({
      org_id: orgId,
      tracking_number,
      carrier: shipmentData.carrier,
      status: "draft",
      origin: shipmentData.origin,
      destination: shipmentData.destination,
      weight_kg: shipmentData.weight_kg ?? null,
      service_type: shipmentData.service_type ?? "standard",
      pickup_date: shipmentData.pickup_date ?? null,
      estimated_delivery: shipmentData.estimated_delivery ?? null,
      notes: shipmentData.notes ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: orgId,
    user_id: user.id,
    action: "shipment_create",
    entity_type: "shipment",
    entity_id: data.id,
    metadata: { tracking_number, carrier: shipmentData.carrier, service_type: shipmentData.service_type },
  });

  revalidatePath("/dashboard");
  return data as Shipment;
}

export async function updateShipmentStatus(id: string, status: ShipmentStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase.from("shipments").select("org_id, status").eq("id", id).single();
  if (!current) throw new Error("Shipment not found");
  await verifyMembership(supabase, current.org_id, user.id);

  const updates: Record<string, unknown> = { status };
  if (status === "delivered") updates.actual_delivery = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("shipments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "shipment_status_change",
    entity_type: "shipment",
    entity_id: id,
    metadata: { previous_status: current.status, new_status: status },
  });

  revalidatePath("/dashboard");
  return data as Shipment;
}

export async function getShipmentInvoices(shipmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: shipment } = await supabase.from("shipments").select("org_id").eq("id", shipmentId).single();
  if (!shipment) throw new Error("Shipment not found");
  await verifyMembership(supabase, shipment.org_id, user.id);

  const { data, error } = await supabase
    .from("shipment_invoices")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data as ShipmentInvoice[];
}

export async function getInvoiceSignedUrl(invoiceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: invoice } = await supabase
    .from("shipment_invoices")
    .select("org_id, storage_path")
    .eq("id", invoiceId)
    .single();
  if (!invoice) throw new Error("Invoice not found");
  await verifyMembership(supabase, invoice.org_id, user.id);
  if (!invoice.storage_path) throw new Error("No file attached to this invoice");

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(invoice.storage_path, 3600);
  if (error) throw error;

  return data.signedUrl;
}
