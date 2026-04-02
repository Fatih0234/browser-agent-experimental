import { OrgProvider } from "@/lib/org-context";
import { OrgSwitcher } from "@/components/shared/org-switcher";
import { NavSidebar } from "@/components/shared/nav-sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase not configured or other error
  }

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <OrgProvider>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-slate-900">Portal Gym</h1>
              <OrgSwitcher />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{user.email}</span>
              <form action="/sign-out" method="post">
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </header>
        <div className="flex">
          <NavSidebar />
          <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
        </div>
      </div>
    </OrgProvider>
  );
}
