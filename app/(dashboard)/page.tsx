import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  let user = null;
  
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase not configured or other error
  }

  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-600">Welcome to the Portal Gym benchmark platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Cases</CardTitle>
            <CardDescription>Manage and track cases</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Case management coming in next milestone</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Upload and manage documents</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Document center coming in next milestone</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Switch and manage organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Organization context coming in next milestone</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
