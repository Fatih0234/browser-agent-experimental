"use client";

import { useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SelectOrgPage() {
  const { currentOrg, isLoading } = useOrg();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentOrg) {
      router.push(`/${currentOrg.slug}`);
    }
  }, [currentOrg, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Select Organization</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          {isLoading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-4" />
              <p className="text-slate-600">Loading organizations...</p>
            </>
          ) : (
            <>
              <p className="text-slate-600 mb-4">
                No organizations found. Please create or join an organization to continue.
              </p>
              <p className="text-sm text-slate-500">
                (Admin can create organizations via seed page)
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
