"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export type TenderStatus = "published" | "open" | "closing_soon" | "closed" | "awarded" | "cancelled";
export type TenderType = "open" | "restricted" | "negotiated";
export type SubmissionStatus = "draft" | "submitted" | "under_review" | "accepted" | "rejected";
export type LegalForm = "GmbH" | "AG" | "KG" | "OHG" | "UG" | "e.K." | "eG";
export type GermanState = "BW" | "BY" | "BE" | "BB" | "HB" | "HH" | "HE" | "MV" | "NI" | "NW" | "RP" | "SL" | "SN" | "ST" | "SH" | "TH";

export interface Company {
  id: string;
  org_id: string;
  name: string;
  legal_form: LegalForm;
  vat_id: string | null;
  tax_number: string | null;
  street: string;
  postcode: string;
  city: string;
  state: GermanState;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  registration_court: string | null;
  hrb_number: string | null;
  is_buyer: boolean;
  is_supplier: boolean;
  seed_run_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tender {
  id: string;
  org_id: string;
  buyer_company_id: string | null;
  tender_id: string;
  title: string;
  description: string | null;
  cpv_codes: string[];
  tender_type: TenderType;
  estimated_value: number | null;
  currency: string;
  publish_date: string;
  deadline_date: string;
  award_date: string | null;
  status: TenderStatus;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  document_count: number;
  seed_run_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  buyer_company?: Company;
}

export interface TenderSubmission {
  id: string;
  org_id: string;
  tender_id: string;
  supplier_company_id: string | null;
  submission_reference: string | null;
  bid_amount: number | null;
  currency: string;
  status: SubmissionStatus;
  technical_proposal: string | null;
  financial_proposal: string | null;
  submitted_at: string | null;
  seed_run_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  supplier_company?: Company;
  tender?: Tender;
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

function generateTenderId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
  return `TD-${year}-${random}`;
}

function generateSubmissionReference(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `BID-${year}-${random}`;
}

// ============================================
// COMPANY ACTIONS
// ============================================

export async function getCompanies(
  orgId: string,
  filters?: {
    is_buyer?: boolean;
    is_supplier?: boolean;
    search?: string;
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
    .from("companies")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("name", { ascending: true })
    .range(from, to);

  if (filters?.is_buyer !== undefined) query = query.eq("is_buyer", filters.is_buyer);
  if (filters?.is_supplier !== undefined) query = query.eq("is_supplier", filters.is_supplier);
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,vat_id.ilike.%${filters.search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { companies: data as Company[], total: count ?? 0, page, pageSize };
}

export async function getCompany(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.from("companies").select("*").eq("id", id).single();
  if (error) throw error;
  if (!data) throw new Error("Company not found");

  await verifyMembership(supabase, data.org_id, user.id);
  return data as Company;
}

export async function createCompany(
  orgId: string,
  companyData: {
    name: string;
    legal_form: LegalForm;
    vat_id?: string;
    tax_number?: string;
    street: string;
    postcode: string;
    city: string;
    state: GermanState;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    registration_court?: string;
    hrb_number?: string;
    is_buyer?: boolean;
    is_supplier?: boolean;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const { data, error } = await supabase
    .from("companies")
    .insert({
      org_id: orgId,
      name: companyData.name,
      legal_form: companyData.legal_form,
      vat_id: companyData.vat_id ?? null,
      tax_number: companyData.tax_number ?? null,
      street: companyData.street,
      postcode: companyData.postcode,
      city: companyData.city,
      state: companyData.state,
      country: companyData.country ?? "DE",
      phone: companyData.phone ?? null,
      email: companyData.email ?? null,
      website: companyData.website ?? null,
      registration_court: companyData.registration_court ?? null,
      hrb_number: companyData.hrb_number ?? null,
      is_buyer: companyData.is_buyer ?? false,
      is_supplier: companyData.is_supplier ?? true,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: orgId,
    user_id: user.id,
    action: "company_create",
    entity_type: "company",
    entity_id: data.id,
    metadata: { name: companyData.name, legal_form: companyData.legal_form },
  });

  revalidatePath("/dashboard");
  return data as Company;
}

export async function updateCompany(
  id: string,
  companyData: Partial<{
    name: string;
    legal_form: LegalForm;
    vat_id: string;
    tax_number: string;
    street: string;
    postcode: string;
    city: string;
    state: GermanState;
    country: string;
    phone: string;
    email: string;
    website: string;
    registration_court: string;
    hrb_number: string;
    is_buyer: boolean;
    is_supplier: boolean;
  }>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase.from("companies").select("org_id, name").eq("id", id).single();
  if (!current) throw new Error("Company not found");
  await verifyMembership(supabase, current.org_id, user.id);

  const { data, error } = await supabase
    .from("companies")
    .update(companyData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "company_update",
    entity_type: "company",
    entity_id: id,
    metadata: { previous_name: current.name, updated_fields: Object.keys(companyData) },
  });

  revalidatePath("/dashboard");
  return data as Company;
}

export async function deleteCompany(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase.from("companies").select("org_id, name").eq("id", id).single();
  if (!current) throw new Error("Company not found");
  await verifyMembership(supabase, current.org_id, user.id);

  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "company_delete",
    entity_type: "company",
    entity_id: id,
    metadata: { name: current.name },
  });

  revalidatePath("/dashboard");
}

// ============================================
// TENDER ACTIONS
// ============================================

export async function getTenders(
  orgId: string,
  filters?: {
    status?: TenderStatus;
    tender_type?: TenderType;
    buyer_company_id?: string;
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
    .from("tenders")
    .select("*, buyer_company:companies(*)", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.tender_type) query = query.eq("tender_type", filters.tender_type);
  if (filters?.buyer_company_id) query = query.eq("buyer_company_id", filters.buyer_company_id);

  const { data, error, count } = await query;
  if (error) throw error;

  return { tenders: data as Tender[], total: count ?? 0, page, pageSize };
}

export async function getTender(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("tenders")
    .select("*, buyer_company:companies(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  if (!data) throw new Error("Tender not found");

  await verifyMembership(supabase, data.org_id, user.id);
  return data as Tender;
}

export async function createTender(
  orgId: string,
  tenderData: {
    buyer_company_id?: string;
    title: string;
    description?: string;
    cpv_codes?: string[];
    tender_type: TenderType;
    estimated_value?: number;
    currency?: string;
    publish_date: string;
    deadline_date: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const tender_id = generateTenderId();

  const { data, error } = await supabase
    .from("tenders")
    .insert({
      org_id: orgId,
      buyer_company_id: tenderData.buyer_company_id ?? null,
      tender_id,
      title: tenderData.title,
      description: tenderData.description ?? null,
      cpv_codes: tenderData.cpv_codes ?? [],
      tender_type: tenderData.tender_type,
      estimated_value: tenderData.estimated_value ?? null,
      currency: tenderData.currency ?? "EUR",
      publish_date: tenderData.publish_date,
      deadline_date: tenderData.deadline_date,
      status: "published",
      contact_name: tenderData.contact_name ?? null,
      contact_email: tenderData.contact_email ?? null,
      contact_phone: tenderData.contact_phone ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: orgId,
    user_id: user.id,
    action: "tender_create",
    entity_type: "tender",
    entity_id: data.id,
    metadata: { tender_id, title: tenderData.title, tender_type: tenderData.tender_type },
  });

  revalidatePath("/dashboard");
  return data as Tender;
}

export async function updateTender(
  id: string,
  tenderData: Partial<{
    title: string;
    description: string;
    cpv_codes: string[];
    tender_type: TenderType;
    estimated_value: number;
    currency: string;
    publish_date: string;
    deadline_date: string;
    award_date: string;
    status: TenderStatus;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
  }>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("tenders")
    .select("org_id, tender_id, status")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Tender not found");
  await verifyMembership(supabase, current.org_id, user.id);

  const { data, error } = await supabase
    .from("tenders")
    .update(tenderData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "tender_update",
    entity_type: "tender",
    entity_id: id,
    metadata: {
      tender_id: current.tender_id,
      previous_status: current.status,
      updated_fields: Object.keys(tenderData),
    },
  });

  revalidatePath("/dashboard");
  return data as Tender;
}

export async function deleteTender(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("tenders")
    .select("org_id, tender_id, title")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Tender not found");
  await verifyMembership(supabase, current.org_id, user.id);

  const { error } = await supabase.from("tenders").delete().eq("id", id);
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "tender_delete",
    entity_type: "tender",
    entity_id: id,
    metadata: { tender_id: current.tender_id, title: current.title },
  });

  revalidatePath("/dashboard");
}

// ============================================
// SUBMISSION ACTIONS
// ============================================

export async function getSubmissions(
  orgId: string,
  filters?: {
    tender_id?: string;
    supplier_company_id?: string;
    status?: SubmissionStatus;
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
    .from("tender_submissions")
    .select("*, supplier_company:companies(*), tender:tenders(*)", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.tender_id) query = query.eq("tender_id", filters.tender_id);
  if (filters?.supplier_company_id) query = query.eq("supplier_company_id", filters.supplier_company_id);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error, count } = await query;
  if (error) throw error;

  return { submissions: data as TenderSubmission[], total: count ?? 0, page, pageSize };
}

export async function getSubmission(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("tender_submissions")
    .select("*, supplier_company:companies(*), tender:tenders(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  if (!data) throw new Error("Submission not found");

  await verifyMembership(supabase, data.org_id, user.id);
  return data as TenderSubmission;
}

export async function createSubmission(
  orgId: string,
  tenderId: string,
  submissionData: {
    supplier_company_id?: string;
    bid_amount?: number;
    currency?: string;
    technical_proposal?: string;
    financial_proposal?: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  // Verify tender exists and belongs to org
  const { data: tender } = await supabase
    .from("tenders")
    .select("id, tender_id, title")
    .eq("id", tenderId)
    .eq("org_id", orgId)
    .single();
  if (!tender) throw new Error("Tender not found");

  const { data, error } = await supabase
    .from("tender_submissions")
    .insert({
      org_id: orgId,
      tender_id: tenderId,
      supplier_company_id: submissionData.supplier_company_id ?? null,
      bid_amount: submissionData.bid_amount ?? null,
      currency: submissionData.currency ?? "EUR",
      status: "draft",
      technical_proposal: submissionData.technical_proposal ?? null,
      financial_proposal: submissionData.financial_proposal ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: orgId,
    user_id: user.id,
    action: "submission_create",
    entity_type: "tender_submission",
    entity_id: data.id,
    metadata: { tender_id: tender.tender_id, tender_title: tender.title },
  });

  revalidatePath("/dashboard");
  return data as TenderSubmission;
}

export async function updateSubmission(
  id: string,
  submissionData: Partial<{
    supplier_company_id: string;
    bid_amount: number;
    currency: string;
    technical_proposal: string;
    financial_proposal: string;
    status: SubmissionStatus;
  }>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("tender_submissions")
    .select("org_id, status, tender_id")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Submission not found");
  await verifyMembership(supabase, current.org_id, user.id);

  const updates: Record<string, unknown> = { ...submissionData };
  if (submissionData.status === "submitted" && current.status === "draft") {
    updates.submitted_at = new Date().toISOString();
    updates.submission_reference = generateSubmissionReference();
  }

  const { data, error } = await supabase
    .from("tender_submissions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "submission_update",
    entity_type: "tender_submission",
    entity_id: id,
    metadata: {
      previous_status: current.status,
      new_status: submissionData.status,
      updated_fields: Object.keys(submissionData),
    },
  });

  revalidatePath("/dashboard");
  return data as TenderSubmission;
}

export async function submitBid(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("tender_submissions")
    .select("org_id, status, tender_id")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Submission not found");
  if (current.status !== "draft") throw new Error("Only draft submissions can be submitted");
  await verifyMembership(supabase, current.org_id, user.id);

  const submission_reference = generateSubmissionReference();
  const { data, error } = await supabase
    .from("tender_submissions")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      submission_reference,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "submission_submit",
    entity_type: "tender_submission",
    entity_id: id,
    metadata: { submission_reference, previous_status: "draft" },
  });

  revalidatePath("/dashboard");
  return data as TenderSubmission;
}

export async function deleteSubmission(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("tender_submissions")
    .select("org_id, submission_reference")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Submission not found");
  await verifyMembership(supabase, current.org_id, user.id);

  const { error } = await supabase.from("tender_submissions").delete().eq("id", id);
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "submission_delete",
    entity_type: "tender_submission",
    entity_id: id,
    metadata: { submission_reference: current.submission_reference },
  });

  revalidatePath("/dashboard");
}
