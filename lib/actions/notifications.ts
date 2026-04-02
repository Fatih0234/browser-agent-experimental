"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Notification {
  id: string;
  user_id: string | null;
  org_id: string | null;
  case_id: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export async function getNotifications(orgId: string, userId: string) {
  const supabase = await createClient();

  // Verify membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .single();

  if (!membership) throw new Error("Not a member of this organization");

  // Get user-scoped and org-scoped notifications
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .or(`user_id.eq.${userId},org_id.eq.${orgId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Notification[];
}

export async function getUnreadCount(orgId: string, userId: string) {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .or(`user_id.eq.${userId},org_id.eq.${orgId}`)
    .eq("read", false);

  if (error) throw error;

  return count || 0;
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify the notification belongs to the user or their org
  const { data: notification } = await supabase
    .from("notifications")
    .select("user_id, org_id")
    .eq("id", notificationId)
    .single();

  if (!notification) throw new Error("Notification not found");

  // Check if user can access this notification
  if (notification.user_id && notification.user_id !== user.id) {
    throw new Error("Not authorized");
  }

  if (notification.org_id) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("org_id", notification.org_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) throw new Error("Not authorized");
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) throw error;

  revalidatePath(`/dashboard`);
}

export async function markAllAsRead(orgId: string, userId: string) {
  const supabase = await createClient();

  // Verify membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .single();

  if (!membership) throw new Error("Not a member of this organization");

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .or(`user_id.eq.${userId},org_id.eq.${orgId}`)
    .eq("read", false);

  if (error) throw error;

  revalidatePath(`/dashboard`);
}

export async function createNotification(
  orgId: string,
  notification: {
    userId?: string;
    caseId?: string;
    type: string;
    title: string;
    message: string;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Only admins can create org-scoped notifications
  if (!notification.userId) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can create organization notifications");
    }
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: notification.userId || null,
      org_id: orgId,
      case_id: notification.caseId || null,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: false,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath(`/dashboard`);
  return data;
}
