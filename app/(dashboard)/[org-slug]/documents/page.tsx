"use client";

import { useOrg } from "@/lib/org-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentsPage() {
  const { currentOrg } = useOrg();

  if (!currentOrg) {
    return <div className="text-slate-600">No organization selected</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Documents</h2>
        <p className="text-slate-600">
          Upload and manage documents for {currentOrg.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Center</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Document management coming in Milestone 5.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
