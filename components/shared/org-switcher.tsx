"use client";

import { useOrg } from "@/lib/org-context";
import { Building2, ChevronDown } from "lucide-react";

export function OrgSwitcher() {
  const { organizations, currentOrg, setCurrentOrg, isLoading } = useOrg();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <Building2 className="h-4 w-4" />
        Loading...
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <Building2 className="h-4 w-4" />
        No organizations
      </div>
    );
  }

  // Simple select dropdown instead of complex menu
  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-gray-500" />
      <select
        value={currentOrg?.slug || ""}
        onChange={(e) => {
          const org = organizations.find(o => o.slug === e.target.value);
          if (org) setCurrentOrg(org);
        }}
        className="text-sm border rounded px-2 py-1 bg-white"
      >
        {organizations.map((org) => (
          <option key={org.id} value={org.slug}>
            {org.name} ({org.role})
          </option>
        ))}
      </select>
    </div>
  );
}
