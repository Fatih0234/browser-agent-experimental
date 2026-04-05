"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import { getEmployees, type Employee, type EmployeeStatus } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  on_leave: "bg-yellow-100 text-yellow-800",
  terminated: "bg-red-100 text-red-800",
};

export default function HRPage() {
  const { currentOrg } = useOrg();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "all">("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function loadEmployees() {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const data = await getEmployees(currentOrg.id, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        department: deptFilter !== "all" ? deptFilter : undefined,
        search: debouncedSearch || undefined,
      });
      setEmployees(data);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadEmployees(); }, [currentOrg, statusFilter, deptFilter, debouncedSearch]);

  if (!currentOrg) return null;

  const departments = Array.from(new Set(employees.map((e) => e.department))).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">HR Portal</h2>
          <p className="text-slate-600">Employee records and employer service submissions</p>
        </div>
        <Link href={`/${currentOrg.slug}/hr/submissions/new`}>
          <Button>New Submission</Button>
        </Link>
      </div>

      {/* Quick links */}
      <div className="flex gap-4 text-sm">
        <Link href={`/${currentOrg.slug}/hr/submissions`} className="text-blue-600 hover:underline">
          All submissions →
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            id="employee-search"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-60"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EmployeeStatus | "all")}>
          <SelectTrigger className="w-40" id="employee-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>

        <Select value={deptFilter} onValueChange={(v) => v && setDeptFilter(v)}>
          <SelectTrigger className="w-44" id="employee-dept-filter">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle>Employees ({employees.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No employees found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-sm">{e.employee_number}</TableCell>
                    <TableCell>
                      <Link href={`/${currentOrg.slug}/hr/employees/${e.id}`} className="font-medium hover:underline">
                        {e.last_name}, {e.first_name}
                      </Link>
                    </TableCell>
                    <TableCell>{e.position}</TableCell>
                    <TableCell>{e.department}</TableCell>
                    <TableCell>{new Date(e.hire_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[e.status] || ""}>{e.status.replace("_", " ")}</Badge>
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
