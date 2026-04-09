"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DeclarationStatus = "draft" | "submitted" | "under_review" | "cleared" | "exception";
export type DeclarationType = "export" | "import" | "transit";
export type DocumentType = "commercial_invoice" | "packing_list" | "certificate_of_origin" | "export_license" | "bill_of_lading" | "other";
export type ExceptionSeverity = "low" | "medium" | "high";
export type ExceptionStatus = "open" | "resolved";

export interface CustomsDeclaration {
  id: string;
  org_id: string;
  reference_number: string;
  declaration_type: DeclarationType;
  status: DeclarationStatus;
  hs_code: string | null;
  commodity_description: string | null;
  quantity: number | null;
  unit_of_measure: string | null;
  declared_value_eur: number | null;
  currency: string;
  origin_country: string | null;
  destination_country: string | null;
  transport_mode: "air" | "sea" | "road" | "rail" | null;
  incoterms: string | null;
  exporter_name: string | null;
  importer_name: string | null;
  customs_office: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  seed_run_id: string | null;
}

export interface CustomsDocument {
  id: string;
  org_id: string;
  declaration_id: string;
  document_type: DocumentType;
  filename: string;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
  seed_run_id: string | null;
}

export interface CustomsException {
  id: string;
  org_id: string;
  declaration_id: string;
  exception_code: string;
  description: string;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  seed_run_id: string | null;
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
    entity_type: "customs_declaration",
    entity_id: entityId,
    metadata,
  });
}

export async function getDeclarations(
  orgId: string,
  filters?: {
    status?: DeclarationStatus | "all";
    declaration_type?: DeclarationType | "all";
    page?: number;
    pageSize?: number;
  }
): Promise<{ declarations: CustomsDeclaration[]; total: number; page: number; pageSize: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("customs_declarations")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.declaration_type && filters.declaration_type !== "all") {
    query = query.eq("declaration_type", filters.declaration_type);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { declarations: (data ?? []) as CustomsDeclaration[], total: count ?? 0, page, pageSize };
}

export async function getDeclaration(orgId: string, id: string): Promise<CustomsDeclaration> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const { data, error } = await supabase
    .from("customs_declarations")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (error || !data) throw new Error("Declaration not found");
  return data as CustomsDeclaration;
}

export async function createDeclaration(
  orgId: string,
  input: {
    declaration_type: DeclarationType;
    origin_country?: string;
    destination_country?: string;
    transport_mode?: "air" | "sea" | "road" | "rail";
    hs_code?: string;
    commodity_description?: string;
    quantity?: number;
    unit_of_measure?: string;
    declared_value_eur?: number;
    currency?: string;
    incoterms?: string;
    exporter_name?: string;
    importer_name?: string;
    customs_office?: string;
    notes?: string;
  }
): Promise<CustomsDeclaration> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const { data, error } = await supabase
    .from("customs_declarations")
    .insert({
      org_id: orgId,
      created_by: user.id,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;

  await logAudit(supabase, orgId, user.id, "customs_declaration_create", data.id, {
    declaration_type: input.declaration_type,
    reference_number: data.reference_number,
  });

  revalidatePath("/dashboard");
  return data as CustomsDeclaration;
}

export async function updateDeclarationStatus(
  orgId: string,
  id: string,
  status: DeclarationStatus
): Promise<CustomsDeclaration> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const existing = await getDeclaration(orgId, id);
  const previousStatus = existing.status;

  const { data, error } = await supabase
    .from("customs_declarations")
    .update({ status })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) throw error;

  await logAudit(supabase, orgId, user.id, "customs_declaration_status_update", id, {
    from: previousStatus,
    to: status,
    reference_number: existing.reference_number,
  });

  revalidatePath("/dashboard");
  return data as CustomsDeclaration;
}

export async function getCustomsDocuments(
  orgId: string,
  declarationId: string
): Promise<CustomsDocument[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const { data, error } = await supabase
    .from("customs_documents")
    .select("*")
    .eq("org_id", orgId)
    .eq("declaration_id", declarationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CustomsDocument[];
}

export async function uploadCustomsDocument(
  orgId: string,
  declarationId: string,
  fileData: { name: string; type: string; arrayBuffer: ArrayBuffer },
  documentType: DocumentType = "other"
): Promise<CustomsDocument> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const ext = fileData.name.split(".").pop() ?? "bin";
  const storagePath = `${orgId}/customs/${declarationId}/${crypto.randomUUID()}.${ext}`;

  // Insert DB record first
  const { data: doc, error: insertError } = await supabase
    .from("customs_documents")
    .insert({
      org_id: orgId,
      declaration_id: declarationId,
      document_type: documentType,
      filename: fileData.name,
      storage_path: storagePath,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, fileData.arrayBuffer, { contentType: fileData.type });

  if (uploadError) {
    // Rollback DB record
    await supabase.from("customs_documents").delete().eq("id", doc.id);
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  await logAudit(supabase, orgId, user.id, "customs_document_upload", declarationId, {
    filename: fileData.name,
    document_type: documentType,
  });

  revalidatePath("/dashboard");
  return doc as CustomsDocument;
}

export async function getCustomsExceptions(
  orgId: string,
  filters?: {
    severity?: ExceptionSeverity | "all";
    status?: ExceptionStatus | "all";
    page?: number;
    pageSize?: number;
  }
): Promise<{ exceptions: CustomsException[]; total: number; page: number; pageSize: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("customs_exceptions")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.severity && filters.severity !== "all") {
    query = query.eq("severity", filters.severity);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { exceptions: (data ?? []) as CustomsException[], total: count ?? 0, page, pageSize };
}

export async function resolveException(
  orgId: string,
  exceptionId: string,
  notes?: string
): Promise<CustomsException> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const { data, error } = await supabase
    .from("customs_exceptions")
    .update({
      status: "resolved",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .eq("id", exceptionId)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: orgId,
    user_id: user.id,
    action: "customs_exception_resolve",
    entity_type: "customs_exception",
    entity_id: exceptionId,
    metadata: { notes: notes ?? null },
  });

  revalidatePath("/dashboard");
  return data as CustomsException;
}
