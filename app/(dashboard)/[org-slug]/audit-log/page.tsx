"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import { getAuditEvents, type AuditEvent } from "@/lib/actions/audit";
import { getActionLabel } from "@/lib/audit-labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList, Shield } from "lucide-react";
import { toast } from "sonner";

const actionColors: Record<string, string> = {
  sign_in: "bg-green-100 text-green-800",
  sign_out: "bg-slate-100 text-slate-800",
  org_switch: "bg-blue-100 text-blue-800",
  org_create: "bg-blue-100 text-blue-800",
  case_create: "bg-blue-100 text-blue-800",
  case_update: "bg-yellow-100 text-yellow-800",
  case_status_change: "bg-yellow-100 text-yellow-800",
  case_delete: "bg-red-100 text-red-800",
  document_upload: "bg-blue-100 text-blue-800",
  document_version_upload: "bg-blue-100 text-blue-800",
  document_delete: "bg-red-100 text-red-800",
  scenario_seed: "bg-purple-100 text-purple-800",
  scenario_reset: "bg-purple-100 text-purple-800",
  admin_action: "bg-red-100 text-red-800",
};

export default function AuditLogPage() {
  const { currentOrg, isAdmin } = useOrg();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      if (!currentOrg) return;
      try {
        const data = await getAuditEvents(currentOrg.id);
        setEvents(data);
      } catch (error) {
        console.error("Error loading audit events:", error);
        toast.error("Failed to load audit log");
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, [currentOrg]);

  if (!currentOrg) {
    return <div className="text-slate-600">No organization selected</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <CardTitle>Admin Only</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-slate-600">
              Only organization admins can view the audit log.
            </p>
          </CardContent>
        </Card>
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
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Audit Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No audit events yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge className={actionColors[event.action] || "bg-slate-100"}>
                        {getActionLabel(event.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {event.entity_type ? (
                        <span className="text-sm">
                          <span className="capitalize">{event.entity_type}</span>
                          {event.entity_id && (
                            <span className="text-slate-400 ml-1">
                              ({event.entity_id.slice(0, 8)}...)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.user_id ? (
                        <span className="font-mono text-xs">
                          {event.user_id.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-slate-400">System</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(event.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
