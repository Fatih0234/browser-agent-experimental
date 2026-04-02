"use client";

import { useOrg } from "@/lib/org-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationsPage() {
  const { currentOrg } = useOrg();

  if (!currentOrg) {
    return <div className="text-slate-600">No organization selected</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
        <p className="text-slate-600">
          View notifications for {currentOrg.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Notifications coming in Milestone 6.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
