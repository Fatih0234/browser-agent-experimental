"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CaseStatus = "draft" | "open" | "in_review" | "needs_correction" | "closed";
export type CasePriority = "low" | "medium" | "high" | "urgent";

export interface Case {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  case_type: string;
  priority: CasePriority;
  status: CaseStatus;
  assigned_user_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function getCases(orgId: string) {
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

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Case[];
}

export async function getCase(caseId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Case not found");

  // Verify membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", data.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("Not a member of this organization");

  return data as Case;
}

export async function createCase(
  orgId: string,
  caseData: {
    title: string;
    description?: string;
    case_type?: string;
    priority?: CasePriority;
  }
) {
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

  const { data, error } = await supabase
    .from("cases")
    .insert({
      org_id: orgId,
      title: caseData.title,
      description: caseData.description || null,
      case_type: caseData.case_type || "general",
      priority: caseData.priority || "medium",
      status: "draft",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit event
  await supabase.from("audit_events").insert({
    org_id: orgId,
    user_id: user.id,
    action: "case_create",
    entity_type: "case",
    entity_id: data.id,
    metadata: { title: caseData.title, case_type: caseData.case_type },
  });

  revalidatePath(`/dashboard`);
  return data;
}

export async function updateCase(
  caseId: string,
  updates: {
    title?: string;
    description?: string;
    case_type?: string;
    priority?: CasePriority;
    status?: CaseStatus;
    assigned_user_id?: string | null;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get current case
  const { data: currentCase } = await supabase
    .from("cases")
    .select("org_id, status")
    .eq("id", caseId)
    .single();

  if (!currentCase) throw new Error("Case not found");

  // Verify membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", currentCase.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("Not a member of this organization");

  const { data, error } = await supabase
    .from("cases")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", caseId)
    .select()
    .single();

  if (error) throw error;

  // Log audit event
  const action = updates.status && updates.status !== currentCase.status
    ? "case_status_change"
    : "case_update";

  await supabase.from("audit_events").insert({
    org_id: currentCase.org_id,
    user_id: user.id,
    action,
    entity_type: "case",
    entity_id: caseId,
    metadata: { ...updates, previous_status: currentCase.status },
  });

  revalidatePath(`/dashboard`);
  return data;
}

export async function deleteCase(caseId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get current case
  const { data: currentCase } = await supabase
    .from("cases")
    .select("org_id")
    .eq("id", caseId)
    .single();

  if (!currentCase) throw new Error("Case not found");

  // Verify admin membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", currentCase.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    throw new Error("Only admins can delete cases");
  }

  const { error } = await supabase.from("cases").delete().eq("id", caseId);

  if (error) throw error;

  // Log audit event
  await supabase.from("audit_events").insert({
    org_id: currentCase.org_id,
    user_id: user.id,
    action: "case_delete",
    entity_type: "case",
    entity_id: caseId,
  });

  revalidatePath(`/dashboard`);
}
