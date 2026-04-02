import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Supabase not configured, just redirect
  }
  redirect("/auth/sign-in");
}
