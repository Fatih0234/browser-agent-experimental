"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: "admin" | "member";
}

interface OrgContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization) => void;
  isLoading: boolean;
  isAdmin: boolean;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadOrganizations() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Fetch organizations with membership role
        const { data, error } = await supabase
          .from("memberships")
          .select(`
            role,
            organizations:org_id (id, name, slug)
          `)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error loading organizations:", error);
          setIsLoading(false);
          return;
        }

        const orgs: Organization[] = data?.map((m: any) => ({
          id: m.organizations.id,
          name: m.organizations.name,
          slug: m.organizations.slug,
          role: m.role as "admin" | "member",
        })) || [];

        setOrganizations(orgs);

        // Set current org from localStorage or default to first
        if (orgs.length > 0) {
          const savedOrgSlug = localStorage.getItem("currentOrgSlug");
          const savedOrg = orgs.find(o => o.slug === savedOrgSlug) || orgs[0];
          setCurrentOrgState(savedOrg);
        }
      } catch (error) {
        console.error("Error in loadOrganizations:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadOrganizations();
  }, []);

  const setCurrentOrg = (org: Organization) => {
    setCurrentOrgState(org);
    localStorage.setItem("currentOrgSlug", org.slug);
  };

  const isAdmin = currentOrg?.role === "admin";

  return (
    <OrgContext.Provider
      value={{
        organizations,
        currentOrg,
        setCurrentOrg,
        isLoading,
        isAdmin,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
