"use client";

import { useOrg } from "@/lib/org-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Briefcase, FileText, Bell } from "lucide-react";

export default function OrgDashboardPage() {
  const { currentOrg, isLoading, isAdmin } = useOrg();

  if (isLoading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  if (!currentOrg) {
    return (
      <div className="text-slate-600">
        No organization selected. Please create or join an organization.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{currentOrg.name}</h2>
        <p className="text-slate-600">
          {isAdmin ? "Organization Admin" : "Organization Member"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-slate-500">Active cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-slate-500">Total documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-slate-500">Unread notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">{currentOrg.slug}</div>
            <p className="text-xs text-slate-500">Slug</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
