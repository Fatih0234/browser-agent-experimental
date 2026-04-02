"use client";

import { useOrg } from "@/lib/org-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building2, ChevronDown, Check } from "lucide-react";

export function OrgSwitcher() {
  const { organizations, currentOrg, setCurrentOrg, isLoading } = useOrg();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Building2 className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (organizations.length === 0) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Building2 className="h-4 w-4 mr-2" />
        No organizations
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="sm">
          <Building2 className="h-4 w-4 mr-2" />
          {currentOrg?.name || "Select organization"}
          <ChevronDown className="h-3 w-3 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => setCurrentOrg(org)}
            className="flex items-center justify-between"
          >
            <span>{org.name}</span>
            {currentOrg?.id === org.id && (
              <Check className="h-4 w-4 text-green-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
