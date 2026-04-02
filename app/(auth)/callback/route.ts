import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    // Exchange code for session - handled by middleware
    return NextResponse.redirect(`${origin}${next}`);
  }

  // If no code, redirect to sign-in
  return NextResponse.redirect(`${origin}/auth/sign-in`);
}
