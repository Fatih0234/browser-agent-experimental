"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithPassword(formData: {
  email: string;
  password: string;
}) {
  console.log("[Server Action] Attempting sign in for:", formData.email);
  
  const supabase = await createClient();
  console.log("[Server Action] Supabase client created");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  console.log("[Server Action] Sign in result:", { 
    success: !!data?.session, 
    error: error?.message,
    errorCode: error?.code,
    errorStatus: error?.status
  });

  if (error) {
    console.error("[Server Action] Sign in error:", error);
    return { error: error.message, code: error.code };
  }

  if (!data?.session) {
    return { error: "No session returned" };
  }

  console.log("[Server Action] Sign in successful, user:", data.user?.id);
  
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
