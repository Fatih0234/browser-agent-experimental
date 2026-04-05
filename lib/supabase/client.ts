import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
}

if (!key) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined");
}

console.log("Supabase client initialized with URL:", url?.slice(0, 30) + "...");
console.log("Key present:", !!key);

export function createClient() {
  return createBrowserClient(url!, key!);
}
