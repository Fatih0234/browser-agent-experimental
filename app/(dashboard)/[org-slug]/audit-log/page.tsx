"use client";

import { useOrg } from "@/lib/org-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuditLogPage() {
  const { currentOrg, isAdmin } = useOrg();

  if (!currentOrg) {
    return <div className="text-slate-600">No organization selected</div>;
  }

  if (!isAdmin) {
    return (
      <div className="text-slate-600">
        Only organization admins can view the audit log.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Audit Log</h2>
        <p className="text-slate-600">
          View audit events for {currentOrg.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Audit log coming in Milestone 6.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
