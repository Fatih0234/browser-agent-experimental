"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Document {
  id: string;
  org_id: string;
  case_id: string | null;
  name: string;
  description: string | null;
  mime_type: string;
  latest_version_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  storage_path: string;
  file_size: number;
  version_number: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentWithVersion extends Document {
  latest_version: DocumentVersion | null;
}

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/csv",
  "text/plain",
  "application/json",
  "image/png",
  "image/jpeg",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export async function getDocuments(orgId: string, caseId?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("Not a member of this organization");

  let query = supabase
    .from("documents")
    .select("*, latest_version:document_versions!documents_latest_version_id_fkey(*)")
    .eq("org_id", orgId);

  if (caseId) {
    query = query.eq("case_id", caseId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;

  return data as DocumentWithVersion[];
}

export async function getDocument(documentId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("documents")
    .select("*, latest_version:document_versions!documents_latest_version_id_fkey(*)")
    .eq("id", documentId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Document not found");

  // Verify membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", data.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("Not a member of this organization");

  return data as DocumentWithVersion;
}

export async function getDocumentVersions(documentId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify access to document
  const { data: doc } = await supabase
    .from("documents")
    .select("org_id")
    .eq("id", documentId)
    .single();

  if (!doc) throw new Error("Document not found");

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", doc.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("Not a member of this organization");

  const { data, error } = await supabase
    .from("document_versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });

  if (error) throw error;

  return data as DocumentVersion[];
}

export async function uploadDocument(
  orgId: string,
  fileData: {
    name: string;
    type: string;
    size: number;
    arrayBuffer: ArrayBuffer;
  },
  options?: {
    caseId?: string;
    description?: string;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Validate file
  if (!ALLOWED_MIME_TYPES.includes(fileData.type)) {
    throw new Error(`File type not allowed: ${fileData.type}`);
  }

  if (fileData.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 25MB limit`);
  }

  // Verify membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("Not a member of this organization");

  // Create document record first (without latest_version_id)
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      org_id: orgId,
      case_id: options?.caseId || null,
      name: fileData.name,
      description: options?.description || null,
      mime_type: fileData.type,
      created_by: user.id,
    })
    .select()
    .single();

  if (docError) throw docError;

  // Upload file to storage
  const fileExt = fileData.name.split(".").pop() || "";
  const storagePath = `${orgId}/${options?.caseId || "general"}/${doc.id}/v1.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, fileData.arrayBuffer, {
      contentType: fileData.type,
    });

  if (uploadError) {
    // Clean up document record if upload fails
    await supabase.from("documents").delete().eq("id", doc.id);
    throw uploadError;
  }

  // Create version record
  const { data: version, error: versionError } = await supabase
    .from("document_versions")
    .insert({
      document_id: doc.id,
      storage_path: storagePath,
      file_size: fileData.size,
      version_number: 1,
      created_by: user.id,
    })
    .select()
    .single();

  if (versionError) {
    // Clean up
    await supabase.storage.from("documents").remove([storagePath]);
    await supabase.from("documents").delete().eq("id", doc.id);
    throw versionError;
  }

  // Update document with latest_version_id
  await supabase
    .from("documents")
    .update({ latest_version_id: version.id })
    .eq("id", doc.id);

  // Log audit event
  await supabase.from("audit_events").insert({
    org_id: orgId,
    user_id: user.id,
    action: "document_upload",
    entity_type: "document",
    entity_id: doc.id,
    metadata: { name: fileData.name, mime_type: fileData.type, size: fileData.size },
  });

  revalidatePath(`/dashboard`);
  return { document: doc, version };
}

export async function uploadNewVersion(
  documentId: string,
  fileData: {
    name: string;
    type: string;
    size: number;
    arrayBuffer: ArrayBuffer;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Validate file
  if (!ALLOWED_MIME_TYPES.includes(fileData.type)) {
    throw new Error(`File type not allowed: ${fileData.type}`);
  }

  if (fileData.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 25MB limit`);
  }

  // Get document
  const { data: doc } = await supabase
    .from("documents")
    .select("org_id, case_id, mime_type")
    .eq("id", documentId)
    .single();

  if (!doc) throw new Error("Document not found");

  // Verify membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", doc.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("Not a member of this organization");

  // Get next version number
  const { data: versions } = await supabase
    .from("document_versions")
    .select("version_number")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  const nextVersionNumber = (versions?.version_number || 0) + 1;

  // Upload file
  const fileExt = fileData.name.split(".").pop() || "";
  const storagePath = `${doc.org_id}/${doc.case_id || "general"}/${documentId}/v${nextVersionNumber}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, fileData.arrayBuffer, {
      contentType: fileData.type,
    });

  if (uploadError) throw uploadError;

  // Create version record
  const { data: version, error: versionError } = await supabase
    .from("document_versions")
    .insert({
      document_id: documentId,
      storage_path: storagePath,
      file_size: fileData.size,
      version_number: nextVersionNumber,
      created_by: user.id,
    })
    .select()
    .single();

  if (versionError) {
    await supabase.storage.from("documents").remove([storagePath]);
    throw versionError;
  }

  // Update document latest_version_id
  await supabase
    .from("documents")
    .update({ latest_version_id: version.id })
    .eq("id", documentId);

  // Log audit event
  await supabase.from("audit_events").insert({
    org_id: doc.org_id,
    user_id: user.id,
    action: "document_version_upload",
    entity_type: "document",
    entity_id: documentId,
    metadata: { version: nextVersionNumber, size: fileData.size },
  });

  revalidatePath(`/dashboard`);
  return version;
}

export async function getSignedUrl(storagePath: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 3600); // 1 hour

  if (error) throw error;

  return data.signedUrl;
}

export async function deleteDocument(documentId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get document
  const { data: doc } = await supabase
    .from("documents")
    .select("org_id")
    .eq("id", documentId)
    .single();

  if (!doc) throw new Error("Document not found");

  // Verify admin membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", doc.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    throw new Error("Only admins can delete documents");
  }

  // Get all versions to delete files
  const { data: versions } = await supabase
    .from("document_versions")
    .select("storage_path")
    .eq("document_id", documentId);

  // Delete files from storage
  if (versions && versions.length > 0) {
    const paths = versions.map((v) => v.storage_path);
    await supabase.storage.from("documents").remove(paths);
  }

  // Delete document (versions cascade)
  const { error } = await supabase.from("documents").delete().eq("id", documentId);

  if (error) throw error;

  // Log audit event
  await supabase.from("audit_events").insert({
    org_id: doc.org_id,
    user_id: user.id,
    action: "document_delete",
    entity_type: "document",
    entity_id: documentId,
  });

  revalidatePath(`/dashboard`);
}
