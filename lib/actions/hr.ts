"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type EmployeeStatus = "active" | "on_leave" | "terminated";
export type SubmissionType = "sick_note" | "kurzarbeit" | "hiring_support";
export type SubmissionStatus = "draft" | "submitted" | "in_review" | "approved" | "rejected";

export interface Employee {
  id: string;
  org_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  hire_date: string;
  status: EmployeeStatus;
  seed_run_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface HrSubmission {
  id: string;
  org_id: string;
  employee_id: string;
  submission_type: SubmissionType;
  status: SubmissionStatus;
  reference_number: string | null;
  submitted_at: string | null;
  metadata: Record<string, unknown>;
  notes: string | null;
  seed_run_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function generateReferenceNumber(type: SubmissionType): string {
  const prefix: Record<SubmissionType, string> = {
    sick_note: "AU",
    kurzarbeit: "KUG",
    hiring_support: "EFZ",
  };
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix[type]}-${year}-${random}`;
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
// EMPLOYEES
// ============================================

export async function getEmployees(
  orgId: string,
  filters?: { status?: EmployeeStatus; department?: string; search?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  let query = supabase
    .from("employees")
    .select("*")
    .eq("org_id", orgId)
    .order("last_name", { ascending: true });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.department) query = query.eq("department", filters.department);
  if (filters?.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,employee_number.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Employee[];
}

export async function getEmployee(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.from("employees").select("*").eq("id", id).single();
  if (error) throw error;
  if (!data) throw new Error("Employee not found");
  await verifyMembership(supabase, data.org_id, user.id);
  return data as Employee;
}

// ============================================
// SUBMISSIONS
// ============================================

export async function getSubmissions(
  orgId: string,
  filters?: { submission_type?: SubmissionType; status?: SubmissionStatus; employee_id?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  let query = supabase
    .from("hr_submissions")
    .select("*, employees(first_name, last_name, employee_number, department)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (filters?.submission_type) query = query.eq("submission_type", filters.submission_type);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.employee_id) query = query.eq("employee_id", filters.employee_id);

  const { data, error } = await query;
  if (error) throw error;
  return data as (HrSubmission & { employees: Pick<Employee, "first_name" | "last_name" | "employee_number" | "department"> })[];
}

export async function getSubmission(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("hr_submissions")
    .select("*, employees(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  if (!data) throw new Error("Submission not found");
  await verifyMembership(supabase, data.org_id, user.id);
  return data;
}

export async function createSubmission(
  orgId: string,
  submissionData: {
    employee_id: string;
    submission_type: SubmissionType;
    metadata?: Record<string, unknown>;
    notes?: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await verifyMembership(supabase, orgId, user.id);

  const { data, error } = await supabase
    .from("hr_submissions")
    .insert({
      org_id: orgId,
      employee_id: submissionData.employee_id,
      submission_type: submissionData.submission_type,
      status: "draft",
      metadata: submissionData.metadata ?? {},
      notes: submissionData.notes ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: orgId,
    user_id: user.id,
    action: "hr_submission_create",
    entity_type: "hr_submission",
    entity_id: data.id,
    metadata: {
      submission_type: submissionData.submission_type,
      employee_id: submissionData.employee_id,
    },
  });

  revalidatePath("/dashboard");
  return data as HrSubmission;
}

export async function submitSubmission(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("hr_submissions")
    .select("org_id, status, submission_type")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Submission not found");
  if (current.status !== "draft") throw new Error("Only draft submissions can be submitted");
  await verifyMembership(supabase, current.org_id, user.id);

  const reference_number = generateReferenceNumber(current.submission_type);

  const { data, error } = await supabase
    .from("hr_submissions")
    .update({
      status: "submitted",
      reference_number,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "hr_submission_submit",
    entity_type: "hr_submission",
    entity_id: id,
    metadata: { reference_number, submission_type: current.submission_type },
  });

  revalidatePath("/dashboard");
  return data as HrSubmission;
}

export async function updateSubmissionStatus(id: string, status: SubmissionStatus, notes?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("hr_submissions")
    .select("org_id, status")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Submission not found");

  const membership = await verifyMembership(supabase, current.org_id, user.id);
  if (membership.role !== "admin") throw new Error("Only admins can update submission status");

  const updates: Record<string, unknown> = { status };
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await supabase
    .from("hr_submissions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("audit_events").insert({
    org_id: current.org_id,
    user_id: user.id,
    action: "hr_submission_status_change",
    entity_type: "hr_submission",
    entity_id: id,
    metadata: { previous_status: current.status, new_status: status },
  });

  revalidatePath("/dashboard");
  return data as HrSubmission;
}
