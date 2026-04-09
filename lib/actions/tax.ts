"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export type FilingType = "USt-Voranmeldung" | "USt-Erklärung" | "Gewerbesteuer" | "Körperschaftsteuer";
export type FilingStatus = "draft" | "submitted" | "accepted" | "rejected" | "correction_needed";
export type DisclosureType = "annual_financial_statements" | "change_notification" | "insolvency" | "merger";
export type DisclosureStatus = "draft" | "submitted" | "published" | "rejected";

// Re-export Company type from tenders.ts for convenience
export type { Company, LegalForm, GermanState } from "./tenders";

export interface TaxFiling {
  id: string;
  org_id: string;
  company_id: string;
  filing_reference: string;
  filing_type: FilingType;
  filing_period: string;
  period_start: string;
  period_end: string;
  revenue: number | null;
  vat_amount: number | null;
  tax_payable: number | null;
  status: FilingStatus;
  elster_tax_number: string | null;
  certificate_id: string | null;
  submitted_at: string | null;
  due_date: string;
  seed_run_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  company?: import("./tenders").Company;
}

export interface Disclosure {
  id: string;
  org_id: string;
  company_id: string;
  disclosure_reference: string;
  disclosure_type: DisclosureType;
  title: string;
  description: string | null;
  status: DisclosureStatus;
  publication_date: string | null;
  bundesanzeiger_id: string | null;
  document_count: number;
  seed_run_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  company?: import("./tenders").Company;
}

// ============================================
// HELPERS
// ============================================

async function verifyMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  userId: string
) {
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .single();
  if (!membership) throw new Error("Not a member of this organization");
  return membership;
}

function generateFilingReference(filingType: FilingType): string {
  const year = new Date().getFullYear();
  const typeCode = filingType.split("-")[0]; // USt, Gewerbe, etc.
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${typeCode}-${year}-${random}`;
}

function generateDisclosureReference(disclosureType: DisclosureType): string {
  const year = new Date().getFullYear();
  const typeCode = disclosureType === "annual_financial_statements" ? "HB" : 
                   disclosureType === "change_notification" ? "ÄM" :
                   disclosureType === "insolvency" ? "IN" : "FU";
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${typeCode}-${year}-${random}`;
}

// ============================================
// TAX FILING ACTIONS
// ============================================

export async function getTaxFilings(
  orgId: string,
  filters?: {
    filing_type?: FilingType;
    status?: FilingStatus;
    company_id?: string;
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
    .from("tax_filings")
    .select("*, company:companies(*)", { count: "exact" })
    .eq("org_id", orgId)
    .order("due_date", { ascending: true })
    .range(from, to);

  if (filters?.filing_type) query = query.eq("filing_type", filters.filing_type);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.company_id) query = query.eq("company_id", filters.company_id);

  const { data, error, count } = await query;
  if (error) throw error;

  return { filings: data as TaxFiling[], total: count ?? 0, page, pageSize };
}

export async function getTaxFiling(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("tax_filings")
    .select("*, company:companies(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  if (!data) throw new Error("Tax filing not found");

  await verifyMembership(supabase, data.org_id, user.id);
  return data as TaxFiling;
}

export async function createTaxFiling(
  orgId: string,
  filingData: {
    company_id: string;
    filing_type: FilingType;
    filing_period: string;
    period_start: string;
    period_end: string;
    revenue?: number;
    vat_amount?: number;
    tax_payable?: number;
    elster_tax_number?: string;
    certificate_id?: string;
    due_date: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const filing_reference = generateFilingReference(filingData.filing_type);

  const { data, error } = await supabase
    .from("tax_filings")
    .insert({
      org_id: orgId,
      company_id: filingData.company_id,
      filing_reference,
      filing_type: filingData.filing_type,
      filing_period: filingData.filing_period,
      period_start: filingData.period_start,
      period_end: filingData.period_end,
      revenue: filingData.revenue ?? null,
      vat_amount: filingData.vat_amount ?? null,
      tax_payable: filingData.tax_payable ?? null,
      status: "draft",
      elster_tax_number: filingData.elster_tax_number ?? null,
      certificate_id: filingData.certificate_id ?? null,
      due_date: filingData.due_date,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: orgId,
    user_id: user.id,
    action: "tax_filing_create",
    entity_type: "tax_filing",
    entity_id: data.id,
    metadata: { filing_reference, filing_type: filingData.filing_type, period: filingData.filing_period },
  });

  revalidatePath("/dashboard");
  return data as TaxFiling;
}

export async function updateTaxFiling(
  id: string,
  filingData: Partial<{
    filing_period: string;
    period_start: string;
    period_end: string;
    revenue: number;
    vat_amount: number;
    tax_payable: number;
    status: FilingStatus;
    elster_tax_number: string;
    certificate_id: string;
    due_date: string;
  }>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("tax_filings")
    .select("org_id, filing_reference, status")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Tax filing not found");
  await verifyMembership(supabase, current.org_id, user.id);

  const updates: Record<string, unknown> = { ...filingData };
  if (filingData.status === "submitted" && current.status === "draft") {
    updates.submitted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("tax_filings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "tax_filing_update",
    entity_type: "tax_filing",
    entity_id: id,
    metadata: {
      filing_reference: current.filing_reference,
      previous_status: current.status,
      updated_fields: Object.keys(filingData),
    },
  });

  revalidatePath("/dashboard");
  return data as TaxFiling;
}

export async function submitTaxFiling(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("tax_filings")
    .select("org_id, filing_reference, status")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Tax filing not found");
  if (current.status !== "draft") throw new Error("Only draft filings can be submitted");
  await verifyMembership(supabase, current.org_id, user.id);

  const { data, error } = await supabase
    .from("tax_filings")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "tax_filing_submit",
    entity_type: "tax_filing",
    entity_id: id,
    metadata: { filing_reference: current.filing_reference, previous_status: "draft" },
  });

  revalidatePath("/dashboard");
  return data as TaxFiling;
}

export async function deleteTaxFiling(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("tax_filings")
    .select("org_id, filing_reference")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Tax filing not found");
  await verifyMembership(supabase, current.org_id, user.id);

  const { error } = await supabase.from("tax_filings").delete().eq("id", id);
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "tax_filing_delete",
    entity_type: "tax_filing",
    entity_id: id,
    metadata: { filing_reference: current.filing_reference },
  });

  revalidatePath("/dashboard");
}

// ============================================
// DISCLOSURE ACTIONS
// ============================================

export async function getDisclosures(
  orgId: string,
  filters?: {
    disclosure_type?: DisclosureType;
    status?: DisclosureStatus;
    company_id?: string;
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
    .from("disclosures")
    .select("*, company:companies(*)", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.disclosure_type) query = query.eq("disclosure_type", filters.disclosure_type);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.company_id) query = query.eq("company_id", filters.company_id);

  const { data, error, count } = await query;
  if (error) throw error;

  return { disclosures: data as Disclosure[], total: count ?? 0, page, pageSize };
}

export async function getDisclosure(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("disclosures")
    .select("*, company:companies(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  if (!data) throw new Error("Disclosure not found");

  await verifyMembership(supabase, data.org_id, user.id);
  return data as Disclosure;
}

export async function createDisclosure(
  orgId: string,
  disclosureData: {
    company_id: string;
    disclosure_type: DisclosureType;
    title: string;
    description?: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const disclosure_reference = generateDisclosureReference(disclosureData.disclosure_type);

  const { data, error } = await supabase
    .from("disclosures")
    .insert({
      org_id: orgId,
      company_id: disclosureData.company_id,
      disclosure_reference,
      disclosure_type: disclosureData.disclosure_type,
      title: disclosureData.title,
      description: disclosureData.description ?? null,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: orgId,
    user_id: user.id,
    action: "disclosure_create",
    entity_type: "disclosure",
    entity_id: data.id,
    metadata: { disclosure_reference, disclosure_type: disclosureData.disclosure_type, title: disclosureData.title },
  });

  revalidatePath("/dashboard");
  return data as Disclosure;
}

export async function updateDisclosure(
  id: string,
  disclosureData: Partial<{
    title: string;
    description: string;
    status: DisclosureStatus;
    publication_date: string;
    bundesanzeiger_id: string;
  }>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("disclosures")
    .select("org_id, disclosure_reference, status")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Disclosure not found");
  await verifyMembership(supabase, current.org_id, user.id);

  const updates: Record<string, unknown> = { ...disclosureData };
  if (disclosureData.status === "published" && current.status !== "published") {
    updates.publication_date = new Date().toISOString().split("T")[0];
  }

  const { data, error } = await supabase
    .from("disclosures")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "disclosure_update",
    entity_type: "disclosure",
    entity_id: id,
    metadata: {
      disclosure_reference: current.disclosure_reference,
      previous_status: current.status,
      updated_fields: Object.keys(disclosureData),
    },
  });

  revalidatePath("/dashboard");
  return data as Disclosure;
}

export async function submitDisclosure(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("disclosures")
    .select("org_id, disclosure_reference, status")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Disclosure not found");
  if (current.status !== "draft") throw new Error("Only draft disclosures can be submitted");
  await verifyMembership(supabase, current.org_id, user.id);

  const { data, error } = await supabase
    .from("disclosures")
    .update({
      status: "submitted",
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "disclosure_submit",
    entity_type: "disclosure",
    entity_id: id,
    metadata: { disclosure_reference: current.disclosure_reference, previous_status: "draft" },
  });

  revalidatePath("/dashboard");
  return data as Disclosure;
}

export async function deleteDisclosure(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("disclosures")
    .select("org_id, disclosure_reference, title")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Disclosure not found");
  await verifyMembership(supabase, current.org_id, user.id);

  const { error } = await supabase.from("disclosures").delete().eq("id", id);
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "disclosure_delete",
    entity_type: "disclosure",
    entity_id: id,
    metadata: { disclosure_reference: current.disclosure_reference, title: current.title },
  });

  revalidatePath("/dashboard");
}
