"use client";

import { useOrg } from "@/lib/org-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSeedPage() {
  const { currentOrg, isAdmin } = useOrg();

  if (!currentOrg) {
    return <div className="text-slate-600">No organization selected</div>;
  }

  if (!isAdmin) {
    return (
      <div className="text-slate-600">
        Only organization admins can access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Scenario Management</h2>
        <p className="text-slate-600">
          Seed and reset scenario data for {currentOrg.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seed / Reset Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Scenario seeding and reset tools coming in Milestone 7.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
