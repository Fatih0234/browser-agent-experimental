"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getOrganizations() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("memberships")
    .select(`
      role,
      organizations:org_id (id, name, slug)
    `)
    .eq("user_id", user.id);

  if (error) throw error;

  return data?.map((m: any) => ({
    id: m.organizations.id,
    name: m.organizations.name,
    slug: m.organizations.slug,
    role: m.role,
  })) || [];
}

export async function createOrganization(name: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Generate slug from name
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name, slug })
    .select()
    .single();

  if (orgError) throw orgError;

  // Add creator as admin
  const { error: memberError } = await supabase
    .from("memberships")
    .insert({
      org_id: org.id,
      user_id: user.id,
      role: "admin",
    });

  if (memberError) throw memberError;

  // Log audit event
  await supabase.from("audit_events").insert({
    org_id: org.id,
    user_id: user.id,
    action: "org_create",
    entity_type: "organization",
    entity_id: org.id,
    metadata: { name },
  });

  revalidatePath("/dashboard");
  return org;
}
