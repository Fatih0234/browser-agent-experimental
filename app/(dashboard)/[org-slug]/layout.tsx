import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface OrgSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    "org-slug": string;
  }>;
}

export default async function OrgSlugLayout({
  children,
  params,
}: OrgSlugLayoutProps) {
  const { "org-slug": orgSlug } = await params;
  let user = null;
  let userOrgs: { slug: string }[] = [];

  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    user = userData.user;

    if (user) {
      // Fetch user's organizations to validate access
      const { data: memberships } = await supabase
        .from("memberships")
        .select("org_id")
        .eq("user_id", user.id);

      if (memberships && memberships.length > 0) {
        const orgIds = memberships.map((m) => m.org_id);
        const { data: orgs } = await supabase
          .from("organizations")
          .select("slug")
          .in("id", orgIds);

        userOrgs = orgs || [];
      }
    }
  } catch {
    // Supabase not configured or other error
  }

  if (!user) {
    redirect("/sign-in");
  }

  // Validate org slug - user must have access to this org
  const hasAccess = userOrgs.some((org) => org.slug === orgSlug);

  if (!hasAccess) {
    // Redirect to org selector if user doesn't have access
    redirect("/select-org");
  }

  // Just render children - the parent (dashboard) layout provides the shell
  return <>{children}</>;
}
